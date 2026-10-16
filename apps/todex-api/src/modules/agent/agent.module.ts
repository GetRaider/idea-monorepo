import { Module } from "@nestjs/common";

import { TasksModule } from "../tasks/tasks.module";
import { ContextService } from "./context/context.service";
import { ConversationsController } from "./conversations/conversations.controller";
import { ConversationsRepository } from "./conversations/conversations.repository";
import { ConversationsService } from "./conversations/conversations.service";
import { JobsController } from "./jobs/jobs.controller";
import { JobsRepository } from "./jobs/jobs.repository";
import { LLM_CLIENT } from "./llm/llm-client";
import { OpenAiCompatibleLlmClient } from "./llm/openai-compatible-llm-client";
import { AgentOrchestrator } from "./orchestrator/agent-orchestrator";
import { AgentQueue } from "./queue/agent-queue";
import { JobWorker } from "./queue/job.worker";
import { AgentRunsRepository } from "./runs/agent-runs.repository";
import { TaskToolHandler } from "./tools/task-tool-handler";
import { ToolExecutionLayer } from "./tools/tool-execution-layer";
import { ToolRegistry } from "./tools/tool-registry";

@Module({
  imports: [TasksModule],
  controllers: [ConversationsController, JobsController],
  providers: [
    ConversationsRepository,
    ConversationsService,
    JobsRepository,
    AgentRunsRepository,
    ContextService,
    ToolRegistry,
    TaskToolHandler,
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
      inject: [ToolRegistry, TaskToolHandler],
      useFactory: (registry: ToolRegistry, tasks: TaskToolHandler) => {
        registry.register(tasks.handlers());
        return true;
      },
    },
  ],
})
export class AgentModule {}
