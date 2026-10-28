import { Module } from "@nestjs/common";

import { ChunksRepository } from "../agent/chunks/chunks.repository";
import { EMBEDDING_CLIENT } from "../agent/llm/embedding-client";
import { OpenAiCompatibleEmbeddingClient } from "../agent/llm/openai-compatible-embedding-client";
import { DocsModule } from "../docs/docs.module";
import { EpicsModule } from "../epics/epics.module";
import { SpacesModule } from "../spaces/spaces.module";
import { TasksModule } from "../tasks/tasks.module";
import { ExecutionResultsService } from "./execution-results.service";
import { KnowledgeSearch } from "./knowledge-search";
import { McpAuthService } from "./mcp-auth";
import { McpHttp } from "./mcp-http";
import { TaskContextService } from "./task-context.service";

@Module({
  imports: [DocsModule, TasksModule, SpacesModule, EpicsModule],
  providers: [
    ChunksRepository,
    OpenAiCompatibleEmbeddingClient,
    {
      provide: EMBEDDING_CLIENT,
      useExisting: OpenAiCompatibleEmbeddingClient,
    },
    ExecutionResultsService,
    KnowledgeSearch,
    TaskContextService,
    McpAuthService,
    McpHttp,
  ],
  exports: [McpHttp],
})
export class McpModule {}
