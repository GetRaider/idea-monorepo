import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  DocMentionTarget,
  DocType,
  type Doc,
  type ProseDoc,
  type ProseNode,
} from "@repo/api/todex";

import { docMentions, docs } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import { ChunksRepository } from "../agent/chunks/chunks.repository";
import {
  EMBEDDING_CLIENT,
  type EmbeddingClient,
} from "../agent/llm/embedding-client";
import { DocsService } from "../docs/docs.service";
import { EpicsService } from "../epics/epics.service";
import { TasksService } from "../tasks/tasks.service";
import {
  ExecutionResultsService,
  type ExecutionResult,
} from "./execution-results.service";
import { omitActualTime } from "./omit-actual-time";

const DOC_TEXT_CAP = 8_000;
const CONTEXT_CAP = 24_000;
const MENTION_LIMIT = 10;

@Injectable()
export class TaskContextService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly tasks: TasksService,
    private readonly docsService: DocsService,
    private readonly epics: EpicsService,
    private readonly results: ExecutionResultsService,
    private readonly chunks: ChunksRepository,
    @Inject(EMBEDDING_CLIENT) private readonly embeddings: EmbeddingClient,
  ) {}

  async get(workspaceId: string, taskId: string): Promise<TaskContext> {
    const task = omitActualTime(await this.tasks.get(workspaceId, taskId));
    const documents: ContextDocument[] = [];
    if (task.goalId) {
      documents.push(
        await this.document(workspaceId, task.goalId),
      );
    }
    const mentioned = await this.mentionedDocs(workspaceId, taskId, task.goalId);
    documents.push(...mentioned);

    let epic: ContextEpic | null = null;
    if (task.epicId) {
      const detail = await this.epics.get(workspaceId, task.epicId);
      if (detail.epic.spaceId === task.spaceId) {
        epic = {
          id: detail.epic.id,
          name: detail.epic.name,
          description: detail.epic.description,
          status: detail.epic.status,
          priority: detail.epic.priority,
        };
      }
    }

    let parent: ContextParent | null = null;
    if (task.parentTaskId) {
      const loaded = omitActualTime(
        await this.tasks.get(workspaceId, task.parentTaskId),
      );
      parent = {
        id: loaded.id,
        taskKey: loaded.taskKey,
        summary: loaded.summary,
        status: loaded.status,
        priority: loaded.priority,
      };
    }

    const executionResults = await this.results.listRecent(workspaceId, taskId);
    const retrieval = await this.retrieve(workspaceId, task.id, task.summary, task.description);
    return fitTaskContext({
      task,
      documents,
      epic,
      parent,
      executionResults,
      chunks: retrieval.chunks,
      retrievalError: retrieval.retrievalError,
      truncated: false,
    });
  }

  private async document(
    workspaceId: string,
    docId: string,
  ): Promise<ContextDocument> {
    const doc = await this.docsService.get(workspaceId, docId);
    return toContextDocument(doc);
  }

  private async mentionedDocs(
    workspaceId: string,
    taskId: string,
    goalId: string | null,
  ): Promise<ContextDocument[]> {
    const rows = await this.db
      .select({ docId: docMentions.docId })
      .from(docMentions)
      .innerJoin(docs, eq(docs.id, docMentions.docId))
      .where(
        and(
          eq(docMentions.targetType, DocMentionTarget.TASK),
          eq(docMentions.targetId, taskId),
          eq(docs.workspaceId, workspaceId),
        ),
      )
      .limit(MENTION_LIMIT + 1);
    const documents: ContextDocument[] = [];
    for (const row of rows) {
      if (row.docId === goalId) continue;
      if (documents.length >= MENTION_LIMIT) break;
      documents.push(await this.document(workspaceId, row.docId));
    }
    return documents;
  }

  private async retrieve(
    workspaceId: string,
    taskId: string,
    summary: string,
    description: string,
  ): Promise<{ chunks: ContextChunk[]; retrievalError: string | null }> {
    try {
      const [embedding] = await this.embeddings.embed([
        `${summary}\n${description}`,
      ]);
      if (!embedding) {
        return { chunks: [], retrievalError: "Knowledge search unavailable" };
      }
      const rows = await this.chunks.search(workspaceId, embedding, 8);
      return {
        chunks: rows
          .filter(
            (row) =>
              (row.sourceType === "doc" || row.sourceType === "task") &&
              row.sourceId !== taskId,
          )
          .map((row) => ({
            title: row.title,
            sourceType: row.sourceType,
            sourceId: row.sourceId,
            snippet: row.content.slice(0, 500),
          })),
        retrievalError: null,
      };
    } catch {
      return { chunks: [], retrievalError: "Knowledge search unavailable" };
    }
  }
}

export function fitTaskContext(payload: TaskContext): TaskContext {
  let truncated = payload.truncated;
  let chunks = [...payload.chunks];
  let documents = payload.documents.map((document) => ({ ...document }));
  const packed = () =>
    JSON.stringify({ ...payload, chunks, documents, truncated });
  while (packed().length > CONTEXT_CAP && chunks.length > 0) {
    chunks = chunks.slice(0, -1);
    truncated = true;
  }
  while (
    packed().length > CONTEXT_CAP &&
    documents.some((document) => document.plainText.length > 0)
  ) {
    documents = documents.map((document) => ({
      ...document,
      plainText: document.plainText.slice(0, Math.floor(document.plainText.length / 2)),
    }));
    truncated = true;
  }
  return { ...payload, chunks, documents, truncated };
}

function toContextDocument(doc: Doc): ContextDocument {
  const plainText = docPlainText(doc).slice(0, DOC_TEXT_CAP);
  return {
    id: doc.id,
    type: doc.type,
    docKey: doc.docKey,
    title: doc.title,
    plainText,
    truncated: docPlainText(doc).length > DOC_TEXT_CAP,
  };
}

function docPlainText(doc: Doc): string {
  if (doc.type === DocType.GOAL) return proseText(doc.body.why);
  return proseText(doc.body.content);
}

function proseText(doc: ProseDoc): string {
  const parts: string[] = [];
  const walk = (node: ProseNode) => {
    if (node.text) parts.push(node.text);
    for (const child of node.content ?? []) walk(child);
  };
  walk(doc);
  return parts.join("");
}

interface ContextDocument {
  id: string;
  type: string;
  docKey: string;
  title: string;
  plainText: string;
  truncated: boolean;
}

interface ContextEpic {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
}

interface ContextParent {
  id: string;
  taskKey: string;
  summary: string;
  status: string;
  priority: string;
}

interface ContextChunk {
  title: string;
  sourceType: "doc" | "task";
  sourceId: string;
  snippet: string;
}

export interface TaskContext {
  task: Record<string, unknown>;
  documents: ContextDocument[];
  epic: ContextEpic | null;
  parent: ContextParent | null;
  executionResults: ExecutionResult[];
  chunks: ContextChunk[];
  retrievalError: string | null;
  truncated: boolean;
}
