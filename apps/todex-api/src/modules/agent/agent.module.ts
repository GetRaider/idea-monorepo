import { Module } from "@nestjs/common";

import { CalendarModule } from "../calendar/calendar.module";
import { DocsModule } from "../docs/docs.module";
import { FoldersModule } from "../folders/folders.module";
import { TasksModule } from "../tasks/tasks.module";
import { ToolAllowsRepository } from "./allows/tool-allows.repository";
import { ContextService } from "./context/context.service";
import { ConversationsController } from "./conversations/conversations.controller";
import { ConversationNamer } from "./conversations/conversation-namer";
import { ConversationsRepository } from "./conversations/conversations.repository";
import { ConversationsService } from "./conversations/conversations.service";
import { JobsController } from "./jobs/jobs.controller";
import { JobsRepository } from "./jobs/jobs.repository";
import { EMBEDDING_CLIENT } from "./llm/embedding-client";
import { JobEventBus } from "./llm/job-event-bus";
import { LLM_CLIENT } from "./llm/llm-client";
import { OpenAiCompatibleEmbeddingClient } from "./llm/openai-compatible-embedding-client";
import { MemoriesRepository } from "./memories/memories.repository";
import { MemoryProposer } from "./memories/memory-proposer";
import { MemoryQueue } from "./memories/memory-queue";
import { MemoryWorker } from "./memories/memory.worker";
import { OpenAiCompatibleLlmClient } from "./llm/openai-compatible-llm-client";
import { OpenAiResponsesLlmClient } from "./llm/openai-responses-llm-client";
import { RoutingLlmClient } from "./llm/routing-llm-client";
import { AgentOrchestrator } from "./orchestrator/agent-orchestrator";
import { AgentQueue } from "./queue/agent-queue";
import { JobWorker } from "./queue/job.worker";
import { AgentRunsRepository } from "./runs/agent-runs.repository";
import { McpRegistration } from "./mcp/mcp-registration";
import { ChunkIngestor } from "./chunks/chunk-ingestor";
import { ChunkWorker } from "./chunks/chunk.worker";
import { ChunksRepository } from "./chunks/chunks.repository";
import { CalendarToolHandler } from "./tools/calendar-tool-handler";
import { DocToolHandler } from "./tools/doc-tool-handler";
import { FolderToolHandler } from "./tools/folder-tool-handler";
import { TaskToolHandler } from "./tools/task-tool-handler";
import { WebSearchToolHandler } from "./tools/web-search-tool-handler";
import { ToolExecutionLayer } from "./tools/tool-execution-layer";
import { ToolRegistry } from "./tools/tool-registry";

@Module({
  imports: [TasksModule, DocsModule, FoldersModule, CalendarModule],
  controllers: [ConversationsController, JobsController],
  providers: [
    ConversationsRepository,
    ConversationNamer,
    ConversationsService,
    JobsRepository,
    ToolAllowsRepository,
    AgentRunsRepository,
    MemoriesRepository,
    MemoryProposer,
    MemoryQueue,
    MemoryWorker,
    ChunksRepository,
    ChunkIngestor,
    ChunkWorker,
    ContextService,
    ToolRegistry,
    TaskToolHandler,
    DocToolHandler,
    FolderToolHandler,
    CalendarToolHandler,
    WebSearchToolHandler,
    ToolExecutionLayer,
    AgentOrchestrator,
    AgentQueue,
    JobWorker,
    McpRegistration,
    OpenAiCompatibleLlmClient,
    OpenAiResponsesLlmClient,
    RoutingLlmClient,
    JobEventBus,
    OpenAiCompatibleEmbeddingClient,
    {
      provide: LLM_CLIENT,
      useExisting: RoutingLlmClient,
    },
    {
      provide: EMBEDDING_CLIENT,
      useExisting: OpenAiCompatibleEmbeddingClient,
    },
    {
      provide: "AGENT_TOOL_REGISTRATION",
      inject: [
        ToolRegistry,
        TaskToolHandler,
        DocToolHandler,
        FolderToolHandler,
        CalendarToolHandler,
        WebSearchToolHandler,
      ],
      useFactory: (
        registry: ToolRegistry,
        tasks: TaskToolHandler,
        docs: DocToolHandler,
        folders: FolderToolHandler,
        calendar: CalendarToolHandler,
        webSearch: WebSearchToolHandler,
      ) => {
        registry.register(tasks.handlers());
        registry.register(docs.handlers());
        registry.register(folders.handlers());
        registry.register(calendar.handlers());
        registry.register(webSearch.handlers());
        return true;
      },
    },
  ],
})
export class AgentModule {}
