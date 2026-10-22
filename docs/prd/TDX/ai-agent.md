# AI agent

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TDX                                        |
| Apps / packages | `apps/todex-api`                           |
| Created         | 2026-10-16                                 |

## Problem

Todex has domain services for tasks, boards, folders, docs, calendar, and execution, and no shared way for a model to call them. A task-only job that also stores the transcript cannot grow into a conversation, a retryable run, or later retrieval over workspace data.

This iteration ships the runtime inside the existing Nest modular monolith: a conversation, a background job per user turn, and an agent run for that execution. The first tool pack, and the first manual test, is task CRUD. Later packs register the same way and call the existing service for that entity.

## Goals

- Keep four separate records: conversation, conversation messages, job, agent run.
- Accept an authenticated message on a conversation and finish the job as `completed` or `failed`.
- Run a bounded tool loop whose orchestrator does not know which entity a tool mutates.
- Call domain services only through a `ToolHandler` adapter. The model never receives a database client.
- Ship the task pack (`list_tasks`, `get_task`, `create_task`, `update_task`, `delete_task`) as the first pack and the acceptance test for the runtime.
- Survive a worker retry without applying the same mutation twice.
- Run locally against host Ollama (`llama3.1:8b`) and Redis/Postgres from Docker.
- Keep the LLM behind `LlmClient` so the provider can change without rewriting the loop.

## Non-goals

- Implementing memories, RAG, pgvector, document ingestion, or ranking in this iteration. The follow-up is specified under **Next**. Do not create those tables now.
- Tool packs for boards, folders, docs, calendar, or execution in this iteration. The registry must accept them later without a schema or job-API change.
- LangChain, LangGraph, or a second agent framework.
- todex-web UI or streaming tokens to the client.
- MCP clients, external HTTP tools, multi-provider routing, or per-token dollar cost.
- Human confirmation before sensitive tools (`awaiting_confirmation`).
- Execute and Ask modes. Every message in this iteration runs with the full tool set. The follow-up is item 7 under **Next**.
- Run checkpoints that resume mid-loop, and automatic memory extraction. A retry starts a new `agent_run` on the same job.
- Prompt-injection classifiers beyond the system prompt and argument checks in this PRD.
- Running Ollama in Docker.
- Moving business rules out of the existing domain services.

## Records

| Entity                  | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `conversations`         | Groups messages belonging to one user/agent conversation in a workspace |
| `conversation_messages` | User messages, assistant responses, and tool-call messages              |
| `jobs`                  | Queued background work for one user turn, and its queue status          |
| `agent_runs`            | One agent execution: model, usage, outcome, limits, and stop reason     |

A conversation has many messages and many jobs. A job belongs to one conversation and has one or more runs (a BullMQ retry inserts another run). Usage and the assistant outcome live on the run. The transcript lives on the conversation. The job does not store either.

`agent_tool_executions` is an execution record for idempotency, not a fifth product entity. It is keyed by the job and `tool_call_id` so a later run on the same job replays a finished tool call.

## User stories

### Open a conversation and submit a turn

**As a** signed-in workspace member, **I want** a conversation I can send several instructions to, **so that** later turns see earlier messages.

**Acceptance criteria**

- [ ] `POST /v1/agent/conversations` returns `201` and `{ id }` for the caller's workspace.
- [ ] `POST /v1/agent/conversations/:id/messages` with `{ "message": string }` appends a user `conversation_messages` row, creates a `pending` job, and returns `201` `{ jobId, conversationId, status: "pending" }`.
- [ ] The body has no entity type field. The model chooses tools from the registry.
- [ ] Unauthenticated calls receive `401`.
- [ ] A conversation or job from another workspace returns `403`.
- [ ] A second POST with the same `idempotencyKey` on that conversation returns the existing job and does not enqueue a second BullMQ job.
- [ ] `GET /v1/agent/jobs/:id` returns the job status plus the latest run's outcome, usage, and error. Missing id is `404`.
- [ ] `GET /v1/agent/conversations/:id` returns the conversation and its messages in `position` order.

### Act on tasks through the first tool pack

**As a** workspace member, **I want** the agent to use task tools, **so that** task rows change only through `TasksService` (board membership, keys, placement, HTML sanitization).

**Acceptance criteria**

- [ ] A scripted model turn that calls `create_task` inserts one task in the conversation's workspace via `TaskToolHandler` → `TasksService.create`.
- [ ] `list_tasks` and `get_task` return tasks from that workspace only.
- [ ] `update_task` and `delete_task` change or remove only a task in that workspace.
- [ ] Tool arguments that include `workspaceId` fail validation and do not call `TasksService`.
- [ ] A domain error from `TasksService` (missing board, forbidden task) is stored as a failed tool result and the loop continues. The run and the job are not marked `failed` solely because of that.

### Add another entity later

**As a** developer, **I want** a new entity to be a new `ToolHandler`, **so that** docs or calendar support does not fork the job worker or the orchestrator.

**Acceptance criteria**

- [ ] `ToolRegistry` stores handlers. The orchestrator asks the registry for definitions and never switches on `create_task`.
- [ ] `ToolExecutionLayer` validates, authorizes, times out, replays, and normalizes. It calls `ToolHandler.handle`. It does not import a domain service.
- [ ] `TaskToolHandler` is the only class in this iteration that imports `TasksService`.
- [ ] `AgentModule` is the only place that registers handlers.

### Stop the loop

**As an** operator, **I want** hard limits recorded on the run, **so that** a model that keeps calling tools cannot run forever.

**Acceptance criteria**

- [ ] The loop stops after `AGENT_MAX_ITERATIONS` (default 8), `AGENT_MAX_DURATION_MS` (default 120000), or when the context estimate exceeds `AGENT_MAX_TOKENS` (default 8000).
- [ ] The run and the job end `failed` with `iteration_limit`, `duration_limit`, or `token_limit`.
- [ ] Those failures are not retried by BullMQ.
- [ ] A final assistant message with no tool calls marks the run and the job `completed`, stores that text on the run as `outcome_text`, and appends an assistant `conversation_messages` row.

## Functional requirements

1. Job lifecycle is `pending` → `running` → `completed` or `failed`. No other statuses.
2. Run lifecycle is `running` → `completed` or `failed`. A run is created when a worker attempt starts. It is not created at enqueue time.
3. Posting a message persists the user message, inserts a `pending` job pointing at that conversation and message, and enqueues BullMQ with `jobId` equal to `jobs.id`.
4. The worker sets the job to `running`, inserts an `agent_runs` row, and runs `AgentOrchestrator` for that run.
5. Each model turn and each tool result is appended to `conversation_messages` for the conversation, with `job_id` and `agent_run_id`, before the next model call.
6. Each tool invocation is one `agent_tool_executions` row keyed by `(job_id, tool_call_id)`. On a later run of the same job, a `completed` row is returned as-is and `ToolHandler.handle` is not called again.
7. The registry shipped in this iteration contains the task pack: `list_tasks`, `get_task`, `create_task`, `update_task`, `delete_task`. Adding a tool is a new `ToolHandler` plus a registration line. It is not a migration.
8. `workspaceId` and `userId` come from the conversation row. `ToolExecutionLayer` passes them into `ToolHandler.handle`. Model arguments cannot override them.
9. `ContextService` assembles the system prompt plus `conversation_messages` for that conversation, oldest first. When the estimate exceeds the token budget, the oldest tool-result messages are dropped until it fits. The system prompt and the latest user message stay.
10. Token estimate is `Math.ceil(characterCount / 4)`. No tokenizer dependency.
11. BullMQ attempts are 3 with exponential backoff for thrown infrastructure errors (Redis, LLM timeout, LLM 5xx). Each attempt is a new run. The previous run is `failed` with `error_code` `worker_failed` before the next attempt starts. Domain tool errors are not throws.
12. When attempts are exhausted, the job is `failed` with `error_code` `worker_failed`. The conversation and its messages stay.
13. Health `GET /health` still checks Postgres and also checks Redis. Redis down returns non-200.
14. The system prompt tells the model to use registered tools for workspace changes and to treat entity text as data. It lists only the tools actually registered.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-api` only. No todex-web changes. No imports from other apps.
- **Reuse (required):**
  - `TasksService` in `apps/todex-api/src/modules/tasks/tasks.service.ts`, called only from `TaskToolHandler`.
  - `WorkspaceGuard` and `zodPipe` the same way `TasksController` uses them.
  - `DRIZZLE_DB` from `DatabaseModule`.
  - Drizzle schema in `apps/todex-api/src/db/schema.ts` and `pnpm db:generate` / `pnpm db:migrate`.
  - Nest `Logger`. Do not add a new logging library.
- **New modules:** one Nest module `AgentModule`, registered in `apps/todex-api/src/modules/app.module.ts`. Orchestrator, queue, context, registry, and execution layer are entity-agnostic. Domain code lives only in tool handlers.

```
apps/todex-api/src/modules/agent/
  agent.module.ts
  conversations/conversations.controller.ts
  conversations/conversations.service.ts
  conversations/conversations.repository.ts
  conversations/conversations.schema.ts
  jobs/jobs.controller.ts
  jobs/jobs.service.ts
  jobs/jobs.repository.ts
  runs/agent-runs.repository.ts
  queue/agent-queue.ts
  queue/job.worker.ts
  orchestrator/agent-orchestrator.ts
  orchestrator/agent-orchestrator.test.ts
  llm/llm-client.ts
  llm/openai-compatible-llm-client.ts
  context/context.service.ts
  context/context.service.test.ts
  tools/tool-handler.ts
  tools/tool-registry.ts
  tools/tool-execution-layer.ts
  tools/task-tool-handler.ts
  tools/task-tool-handler.test.ts
  guardrails/reject-workspace-argument.ts
```

`tool-handler.ts` is the adapter later packs implement. The handler owns the tool definition and the call into one business service:

```ts
interface ToolHandler {
  readonly name: string;
  readonly description: string;
  readonly parameters: ZodType;
  handle(input: { workspaceId: string; userId: string; args: unknown }): Promise<unknown>;
}
```

`TaskToolHandler` implements that for the five task tools (one class, five definitions, or five small classes — one class with a `handlers()` method is enough). A later pack is a sibling handler (`DocToolHandler`) registered from `agent.module.ts`. Do not add those files in this iteration.

Call path: `AgentOrchestrator` → `ToolExecutionLayer` → `ToolHandler.handle` → domain service.

- **Export change:** `TasksModule` exports `TasksService`. `AgentModule` imports `TasksModule`. Future handlers import the module that already exports their service. Do not export unused services now.
- **`TasksService.get`:** add a public `get(workspaceId, taskId)` that loads through the existing workspace check and returns the same mapped task shape as `move`. `get_task` calls it. Do not make `requireTaskInWorkspace` public.
- **LLM:** `LlmClient` is the only type the orchestrator depends on. `OpenAiCompatibleLlmClient` uses the `openai` package. When `AI_PROVIDER=local`, set `baseURL` to `AI_BASE_URL`. API key is `AI_API_KEY` or the string `ollama` when the provider is local and the key is empty. Unit tests use an in-file fake that implements `LlmClient`. There is no fake in the Nest graph.
- **Queue:** `bullmq` + `ioredis`. Queue name `agent-jobs`. The worker starts in the API process (`OnModuleInit` / `OnModuleDestroy`). No separate worker app.
- **Import boundaries:** `TaskToolHandler` calls `TasksService`. It does not import `schema.ts` or `DRIZZLE_DB`. The orchestrator and `ToolExecutionLayer` do not import `TasksService`.

### Data layer

- **Schema changes:** Drizzle tables in `src/db/schema.ts`. Text ids (`randomUUID()`), timestamps with the same `$defaultFn(() => new Date())` style as `workspaces`. `tool_name` is plain text so new tools do not need an enum migration.

`conversations`

| Column       | Type                                                |
| ------------ | --------------------------------------------------- |
| id           | text pk                                             |
| workspace_id | text not null, fk `workspaces.id` on delete cascade |
| user_id      | text not null, fk `users.id`                        |
| created_at   | timestamp not null                                  |
| updated_at   | timestamp not null                                  |

`conversation_messages`

| Column         | Type                                                        |
| -------------- | ----------------------------------------------------------- |
| id             | text pk                                                     |
| conversation_id | text not null, fk `conversations.id` on delete cascade     |
| job_id         | text null, fk `jobs.id`                                     |
| agent_run_id   | text null, fk `agent_runs.id`                               |
| position       | integer not null                                            |
| role           | text not null (`system`, `user`, `assistant`, `tool`)       |
| content        | text not null, default `""`                                 |
| tool_calls     | jsonb null                                                  |
| tool_call_id   | text null                                                   |
| created_at     | timestamp not null                                          |

Unique index on `(conversation_id, position)`.

`job_id` and `agent_run_id` are null only for a system row if one is stored. User rows set `job_id` and leave `agent_run_id` null. Assistant and tool rows set both. Do not persist a system row in this iteration; `ContextService` prepends the system prompt in memory.

`jobs`

| Column            | Type                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| id                | text pk                                                              |
| conversation_id   | text not null, fk `conversations.id` on delete cascade               |
| workspace_id      | text not null, fk `workspaces.id` on delete cascade                  |
| user_id           | text not null, fk `users.id`                                         |
| user_message_id   | text not null, fk `conversation_messages.id`                         |
| status            | enum `agent_job_status`: `pending`, `running`, `completed`, `failed` |
| idempotency_key   | text not null                                                        |
| error_code        | text null                                                            |
| error_message     | text null                                                            |
| started_at        | timestamp null                                                       |
| finished_at       | timestamp null                                                       |
| created_at        | timestamp not null                                                   |
| updated_at        | timestamp not null                                                   |

Unique index on `(conversation_id, idempotency_key)`.

The job does not have a `message` or `result` column. The user text is the linked message. The outcome is the latest run.

`agent_runs`

| Column            | Type                                                          |
| ----------------- | ------------------------------------------------------------- |
| id                | text pk                                                       |
| job_id            | text not null, fk `jobs.id` on delete cascade                 |
| attempt           | integer not null                                              |
| status            | enum `agent_run_status`: `running`, `completed`, `failed`     |
| model             | text not null                                                 |
| outcome_text      | text null                                                     |
| prompt_tokens     | integer not null, default 0                                   |
| completion_tokens | integer not null, default 0                                   |
| iteration_count   | integer not null, default 0                                   |
| max_iterations    | integer not null                                              |
| max_duration_ms   | integer not null                                              |
| max_tokens        | integer not null                                              |
| error_code        | text null                                                     |
| error_message     | text null                                                     |
| started_at        | timestamp not null                                            |
| finished_at       | timestamp null                                                |

Unique index on `(job_id, attempt)`.

`agent_tool_executions`

| Column       | Type                                                |
| ------------ | --------------------------------------------------- |
| id           | text pk                                             |
| job_id       | text not null, fk `jobs.id` on delete cascade       |
| agent_run_id | text not null, fk `agent_runs.id`                   |
| tool_call_id | text not null                                       |
| tool_name    | text not null                                       |
| arguments    | jsonb not null                                      |
| status       | text not null (`completed` or `failed`)             |
| result       | jsonb not null                                      |
| created_at   | timestamp not null                                  |

Unique index on `(job_id, tool_call_id)`.

Insert order for a new turn: `conversations` (already exists) → `conversation_messages` (user) → `jobs`. The `user_message_id` FK is added after both tables exist in the same migration. Drizzle can declare `jobs.user_message_id` without an inline FK and add the FK in the SQL migration if the cycle is awkward; the database must still enforce it.

- **Migration:** one new Drizzle migration via `pnpm --filter todex-api db:generate`. No seed. No `vector` extension.
- **Queries / persistence:** `ConversationsRepository` writes conversations and messages. `JobsRepository` writes jobs. `AgentRunsRepository` writes runs and tool executions. Status changes are conditional (`pending` → `running`, `running` → terminal) so a duplicate worker cannot reopen a finished job.

### API & contracts

- **Endpoints:** global prefix `v1` already applies. `@UseGuards(WorkspaceGuard)`. Routes are not under `/tasks`.

`POST /v1/agent/conversations`

- No body.
- `201` `{ id: string }`.

`POST /v1/agent/conversations/:id/messages`

- Body: `{ message: string (1–4000), idempotencyKey?: string (1–200) }`.
- If `idempotencyKey` is omitted, the server generates a UUID (each call is a new job).
- `201` `{ jobId, conversationId, status: "pending" }`.
- Same conversation + same key: `200` with the existing job payload.
- Unknown conversation: `404`. Other workspace: `403`.

`GET /v1/agent/conversations/:id`

- `200` `{ id, messages: [{ id, role, content, toolCalls, toolCallId, position, jobId, agentRunId }] }`.

`GET /v1/agent/jobs/:id`

- `200` `{ id, conversationId, status, errorCode, errorMessage, run }`.
- `run` is the latest attempt or `null` while still `pending`: `{ id, attempt, status, outcomeText, promptTokens, completionTokens, iterationCount, errorCode, errorMessage }`.
- Missing id: `404`. Other workspace: `403`.

- **Shared types:** none in `@repo/api`. Zod schemas live in `conversations/conversations.schema.ts`.
- **Validation:** `zodPipe` on the body. Every tool schema is Zod `strict` and rejects `workspaceId`.

Task pack argument schemas (the only pack in this iteration):

| Tool          | Fields                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `list_tasks`  | `boardId: string`                                                      |
| `get_task`    | `taskId: string`                                                       |
| `create_task` | `taskBoardId: string`, `summary: string`, optional `description`, `status`, `priority` using the same enums as `CreateTaskBodySchema` |
| `update_task` | `taskId: string`, optional `summary`, `description`, `status`, `priority` |
| `delete_task` | `taskId: string`                                                       |

`create_task` / `update_task` pass only those fields into `TasksService`. They do not accept recurrence, estimation, dates, area, or parent id in this slice. A later revision of the task pack can widen the schema without changing these tables.

Normalized tool result stored and sent back to the model: `{ ok: true, data: unknown }` or `{ ok: false, error: string }`. Same shape for every handler.

### Frontend (if applicable)

N/A.

### Auth & permissions

`WorkspaceGuard` on every route. The conversation stores `workspaceId` and `userId`. Jobs copy those ids so a worker does not re-resolve membership. `ToolExecutionLayer` passes the conversation's pair into every handler. A tool cannot override them.

### Error handling & edge cases

- Empty or whitespace `message`: `400`.
- Unknown tool name or invalid JSON arguments: persist `{ ok: false, error }` on the tool execution and a tool `conversation_messages` row. Continue the loop.
- Domain service `BadRequestException` / `ForbiddenException`: map `message` into `{ ok: false, error }`. Continue the loop. `ToolExecutionLayer` does this for any handler, not only tasks.
- `ToolHandler.handle` exceeds 15s: `{ ok: false, error: "timeout" }`. Continue the loop.
- LLM call timeout 60s, one retry inside the client for HTTP 429 and 5xx, then throw so BullMQ retries the job.
- BullMQ retry inserts a new `agent_run` with `attempt + 1`. Completed tool rows for that `job_id` are replayed. The job stays `running`.
- Limit breach marks the run and the job `failed`, then throws `UnrecoverableError` (BullMQ).
- Worker crash mid-run: job stays `running` until BullMQ retries or attempts are exhausted. On final failure, job `failed` with `error_code` `worker_failed`.
- System prompt states that text stored on workspace entities is data, and that changes go through tools. No additional classifier.

### Testing

- **Unit / integration:**
  - `agent-orchestrator.test.ts`: fake `LlmClient` returns a tool call, then a final text. Assert one `ToolHandler.handle` call, a new user message on the conversation, an assistant message, a completed run with `outcome_text`, and a completed job. A second run on the same job with the same `tool_call_id` does not call `handle` again. The test must not branch on task-specific fields.
  - Same file: iteration limit ends the run and the job `failed` / `iteration_limit` when every turn is a tool call, and does not ask BullMQ to retry.
  - `task-tool-handler.test.ts`: `workspaceId` in arguments does not call `TasksService`. `create_task` calls `create` with the conversation workspace id.
  - `context.service.test.ts`: over-budget conversation history drops oldest tool results and keeps the system prompt and the latest user message. Messages from an earlier job on the same conversation are included.
  - Conversations service test: duplicate idempotency key on one conversation does not insert a second job. A second conversation may reuse the same key.
- **E2E:** none. Existing `test/tasks.e2e-spec.ts` stays as it is.
- **Manual checks:** see `apps/todex-api/README.md` section "Agent jobs (local Ollama)". The script creates a conversation, posts one task instruction, and polls the job. The same message endpoint is what later packs will use.

### Deployment & ops

- **Env vars** in `apps/todex-api/src/env/env.ts` and `.env.example`. Add `REDIS_URL` to `turbo.json` `globalEnv`. `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, and `AI_BASE_URL` are already global.

| Variable                | Rule                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `REDIS_URL`             | required URL, local default `redis://localhost:6379`                 |
| `AI_PROVIDER`           | `local` or `external`, default `local`                               |
| `AI_MODEL`              | default `llama3.1:8b`                                                |
| `AI_BASE_URL`           | required when provider is `local`, default `http://localhost:11434/v1` |
| `AI_API_KEY`            | optional; local client uses `ollama` when empty                     |
| `AGENT_MAX_ITERATIONS`  | optional positive int, default `8`                                   |
| `AGENT_MAX_DURATION_MS` | optional positive int, default `120000`                              |
| `AGENT_MAX_TOKENS`      | optional positive int, default `8000`                                |

In `NODE_ENV=test`, `REDIS_URL` and `AI_BASE_URL` may be absent. Tests must not open Redis or Ollama.

- **Scripts / commands:** `docker compose up -d` also starts Redis. `pnpm db:migrate` applies the agent tables. Ollama stays a host process.
- **Rollout notes:** `apps/todex-api/docker-compose.yml` gains a `redis:7-alpine` service on host port `6379`. Postgres image stays `postgres:15` until the pgvector follow-up.

## UX / UI

N/A. Clients create a conversation, post messages, and poll `GET /v1/agent/jobs/:id` until `status` is `completed` or `failed`.

## Dependencies & risks

- `llama3.1:8b` often answers in prose instead of `tool_calls`. Mitigation: the manual test reads `GET /v1/agent/conversations/:id` for a tool message. If there is none, the job can still be `completed` with assistant text and zero task writes. Switch `AI_MODEL` to a stronger tool model (`qwen2.5:7b`) only after that failure. Do not add a second model dependency to the default.
- BullMQ retries can double-apply a mutation if tool replay is skipped. The unique `(job_id, tool_call_id)` row is the mitigation and has a unit test.
- A new run does not resume mid-loop. The model may emit new `tool_call_id`s and run tools again. Replay only covers ids already stored. Checkpoints are a later change on `agent_runs`, not a reason to merge runs into jobs.
- Official `openai` SDK uses its own HTTP stack. That is the allowed exception to the monorepo `httpClient` rule, and it stays inside `OpenAiCompatibleLlmClient`.
- Hardcoding task names in the orchestrator would block the next entity. Mitigation: the orchestrator only sees `ToolHandler` definitions.

## Next

Not part of this iteration's checklist. Each item is a later PRD on top of these four records. `ContextService` is the only assembly point; it grows new inputs without the orchestrator learning about storage.

1. **Memories.** After a run reaches `completed`, enqueue a separate job that proposes memories from that conversation. Table `agent_memories`: `id`, `workspace_id`, `user_id`, `conversation_id` null, `content`, `created_at`. `ContextService` appends the workspace's memories after the system prompt and before transcript messages, still inside `AGENT_MAX_TOKENS`. No extraction in the task-CRUD run itself.
2. **Documents and chunks.** Tables `agent_documents` (`id`, `workspace_id`, `source_type`, `source_id`, `title`) and `agent_chunks` (`id`, `document_id`, `position`, `content`). Source types start with doc and task. Ingestion calls existing doc/task services to read text. It does not let the model query Postgres.
3. **pgvector.** Change the Compose image from `postgres:15` to `pgvector/pgvector:pg15` and add `CREATE EXTENSION vector`. Add `agent_chunks.embedding vector(n)` in that migration. Existing local `pgdata` volumes must be recreated. Embeddings are written by an ingestion job, not by `TaskToolHandler`.
4. **Retrieval.** `ContextService` embeds the latest user message, ranks chunks by cosine distance for the job's workspace, and inserts the top chunks under the token budget after memories and before old tool results. Drop lowest-ranked chunks first when over budget.
5. **MCP and external tools.** A `ToolHandler` whose `handle` calls an MCP client or `httpClient`. Same execution layer: validation, workspace injection, timeout, replay, normalized result.
6. **Sensitive-action confirmation.** New job status `awaiting_confirmation` for handlers marked sensitive (delete is the first). The run stops without calling `handle` until a follow-up message confirms. Do not add the status in this iteration's enum.
7. **Execute and Ask.** The mode is chosen per message, not per conversation, and stored on the job. `POST /v1/agent/conversations/:id/messages` accepts `mode: "execute" | "ask"`. Omit it and the job runs as `execute`, which is today's behavior: every registered tool is sent to `LlmClient`. `ask` keeps read tools (`list_*`, `get_*`) and drops write tools (`create_*`, `update_*`, `delete_*`) before `complete`. Each `ToolHandler` declares `read` or `write`. `ToolRegistry` filters definitions. The orchestrator only forwards the job mode. The Ask system prompt states that this run cannot change workspace data. The composer in `apps/todex-web` gets a toggle beside the send button. Do not add the column or the toggle in this iteration.

## Open questions

- None for this iteration. The second tool pack (docs, calendar, or boards) is chosen when that pack is specified. Memories and retrieval follow the order under **Next**.

## Success criteria

- `pnpm --filter todex-api test` passes without Redis or Ollama.
- With Docker Postgres and Redis, host Ollama, and a session cookie, the manual flow in the API README finishes the job `completed`, the latest run has `outcome_text`, and the task is visible from `GET /v1/tasks?boardId=...` when the model emits `create_task`.
- A second message on the same conversation creates a second job, and context for that run includes the first turn's messages.
- A second run of the same job with the same tool call id does not insert a second task.
- Registering another `ToolHandler` does not require a new conversation, job, or run table.

## Implementation checklist

- [ ] Add Redis to `apps/todex-api/docker-compose.yml`. Extend env parsing, `.env.example`, and `turbo.json` `globalEnv` with `REDIS_URL`.
- [ ] Add `conversations`, `conversation_messages`, `jobs`, `agent_runs`, and `agent_tool_executions` to `src/db/schema.ts`. Generate and commit the Drizzle migration. Do not add memory, document, or vector tables.
- [ ] Add conversation create, message post, conversation read, and job read. Idempotency is per conversation. Export `TasksService` from `TasksModule`. Add `TasksService.get`.
- [ ] Add `ToolHandler`, `ToolRegistry`, `ToolExecutionLayer`, `TaskToolHandler`, `LlmClient`, `OpenAiCompatibleLlmClient`, `ContextService`, and `AgentOrchestrator`. Register `TaskToolHandler` from `AgentModule` only.
- [ ] Add the BullMQ queue and in-process `JobWorker`. Each attempt inserts a new run. Replay tool executions by `(job_id, tool_call_id)`. Limit breaches use `UnrecoverableError`.
- [ ] Extend `HealthController` to ping Redis.
- [ ] Add the unit tests listed under Testing. Run `pnpm --filter todex-api test` and `pnpm --filter todex-api build`.
- [ ] Update `apps/todex-api/README.md` so the local section creates a conversation, posts a message, and polls the job.
