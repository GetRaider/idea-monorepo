import { Module } from "@nestjs/common";

import { CalendarModule } from "../calendar/calendar.module";
import { DocsModule } from "../docs/docs.module";
import { FoldersModule } from "../folders/folders.module";
import { TasksModule } from "../tasks/tasks.module";
import { ContextService } from "./context/context.service";
import { ConversationsController } from "./conversations/conversations.controller";
import { ConversationsRepository } from "./conversations/conversations.repository";
import { ConversationsService } from "./conversations/conversations.service";
import { JobsController } from "./jobs/jobs.controller";
import { JobsRepository } from "./jobs/jobs.repository";
import { LLM_CLIENT } from "./llm/llm-client";
import { MemoriesRepository } from "./memories/memories.repository";
import { MemoryProposer } from "./memories/memory-proposer";
import { MemoryQueue } from "./memories/memory-queue";
import { MemoryWorker } from "./memories/memory.worker";
import { OpenAiCompatibleLlmClient } from "./llm/openai-compatible-llm-client";
import { AgentOrchestrator } from "./orchestrator/agent-orchestrator";
import { AgentQueue } from "./queue/agent-queue";
import { JobWorker } from "./queue/job.worker";
import { AgentRunsRepository } from "./runs/agent-runs.repository";
import { CalendarToolHandler } from "./tools/calendar-tool-handler";
import { DocToolHandler } from "./tools/doc-tool-handler";
import { FolderToolHandler } from "./tools/folder-tool-handler";
import { TaskToolHandler } from "./tools/task-tool-handler";
import { ToolExecutionLayer } from "./tools/tool-execution-layer";
import { ToolRegistry } from "./tools/tool-registry";

@Module({
  imports: [TasksModule, DocsModule, FoldersModule, CalendarModule],
  controllers: [ConversationsController, JobsController],
  providers: [
    ConversationsRepository,
    ConversationsService,
    JobsRepository,
    AgentRunsRepository,
    MemoriesRepository,
    MemoryProposer,
    MemoryQueue,
    MemoryWorker,
    ContextService,
    ToolRegistry,
    TaskToolHandler,
    DocToolHandler,
    FolderToolHandler,
    CalendarToolHandler,
    ToolExecutionLayer,
    AgentOrchestrator,
    AgentQueue,
    JobWorker,
    OpenAiCompatibleLlmClient,
    {
      provide: LLM_CLIENT,
      useExisting: OpenAiCompatibleLlmClient,
    },
    {
      provide: "AGENT_TOOL_REGISTRATION",
      inject: [
        ToolRegistry,
        TaskToolHandler,
        DocToolHandler,
        FolderToolHandler,
        CalendarToolHandler,
      ],
      useFactory: (
        registry: ToolRegistry,
        tasks: TaskToolHandler,
        docs: DocToolHandler,
        folders: FolderToolHandler,
        calendar: CalendarToolHandler,
      ) => {
        registry.register(tasks.handlers());
        registry.register(docs.handlers());
        registry.register(folders.handlers());
        registry.register(calendar.handlers());
        return true;
      },
    },
  ],
})
export class AgentModule {}
