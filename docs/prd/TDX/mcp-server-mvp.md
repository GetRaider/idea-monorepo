# Todex MCP Server MVP

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TDX                                        |
| Apps / packages | `apps/todex-api`, `apps/todex-web`         |
| Created         | 2026-10-28                                 |

## Problem

External AI tools (Claude, ChatGPT, Cursor) cannot read or update Todex. Research has to be pasted into Knowledge, and coding agents have to be handed task context by hand. Todex already has the source of truth: Postgres, workspace membership, docs, spaces, epics, tasks, and chunk retrieval. The in-app agent can call those services. Remote clients cannot.

Plan A is this MVP: external tools write Knowledge through MCP, planning stays in Todex, Cursor pulls task context and writes results back. Plan B (discovery inside the Todex agent) uses the same services later and is not part of this work.

## Goals

- A remote MCP client authenticates as a Todex user and calls tools over Streamable HTTP.
- The client can create and update Knowledge documents (`type: common`).
- Cursor can load one task plus bounded related context and submit an execution result without copying.
- Task status changes only when `update_task` says so. `submit_execution_result` never marks a task done.
- MCP responses never include execution sessions, intervals, durations, or `actualTime`.
- In-app agent tools, confirmation, and `MCP_SERVER_URL` (outbound client) keep working.

## Non-goals

- Plan B: discovery or research inside the Todex AI Agent.
- A2A, autonomous orchestration, agent delegation, or driving Cursor programmatically.
- Calendar, folder, epic, or space write tools. Epics and sections are passed through existing task fields only.
- Delete tools (`delete_task`, `delete_doc`).
- Creating Planning goals (`type: goal`) through MCP. Goals stay on the in-app `create_doc` tool.
- Changing HTTP API payloads. `TasksService` may still return `actualTime` to the web app.
- New workspace roles or resource ACLs. Membership is still the boundary.
- Renaming in-app tools (`list_docs`, `get_doc`, `create_task`, …) or registering MCP tools on `ToolRegistry`.
- A second deployable service.

## User stories

### Connect an external client

**As a** workspace member, **I want** Claude, ChatGPT, or Cursor to sign in to Todex, **so that** the agent acts as me and only in my workspace.

**Acceptance criteria**

- [ ] Unauthenticated `POST /mcp` returns 401 with `WWW-Authenticate` pointing at protected-resource metadata.
- [ ] OAuth 2.1 authorization-code + S256 PKCE issues a user access token. Public clients can register dynamically. Consent is shown on todex-web.
- [ ] A personal access token created in Settings authenticates the same `/mcp` endpoint with `Authorization: Bearer`.
- [ ] A revoked or expired token is rejected.
- [ ] A token for a user who is not in exactly one workspace is rejected with 403. The client cannot pass `workspaceId`.

### Write Knowledge from an external tool

**As a** user researching in an external AI tool, **I want** that tool to create and update Knowledge docs, **so that** planning in Todex sees the same documents.

**Acceptance criteria**

- [ ] `create_document` creates a `common` doc through `DocsService.create` and returns id, `docKey`, title, and plain text.
- [ ] `update_document` updates that doc through `DocsService.update`.
- [ ] `search_knowledge` returns at most 8 doc chunks from `ChunksRepository.search` in the caller’s workspace.
- [ ] `get_document` returns one doc in that workspace. A doc id from another workspace is forbidden.
- [ ] A read-only token cannot create or update.

### Pull a task into Cursor and send the result back

**As a** user, **I want** Cursor to fetch a task and its related knowledge and then file an implementation result, **so that** I review the outcome in Todex.

**Acceptance criteria**

- [ ] `list_spaces` and `list_tasks` return only the caller’s workspace.
- [ ] `get_task` returns planning fields and omits `actualTime`.
- [ ] `get_task_context` returns the task, its goal doc when `goalId` is set, mentioning docs, epic summary, parent summary, recent execution results, and at most 8 retrieved chunks, capped at 24,000 characters.
- [ ] `create_task` and `update_task` persist through `TasksService` with the existing Zod bodies.
- [ ] `submit_execution_result` inserts a `task_execution_results` row and does not change `tasks.status`.
- [ ] `update_task` may set `status` to `done` only when the arguments include that status.
- [ ] Context and task payloads contain no session intervals, break data, or per-user execution history.

## Functional requirements

1. Expose one Streamable HTTP MCP endpoint at `/mcp` on `todex-api` (GET, POST, DELETE). Stateless: every request authenticates. Do not keep an in-memory session map.
2. Tools, names exact:

| Tool | Access | Behavior |
| ---- | ------ | -------- |
| `search_knowledge` | read | Embed `query` (1–500 chars). `ChunksRepository.search(workspaceId, embedding, 8)`. Keep `sourceType === "doc"`. Return `{ title, sourceId, snippet }` with snippet ≤ 500 chars. |
| `get_document` | read | `DocsService.get`. Return id, type, docKey, title, folderId, plain text, updatedAt. Plain text ≤ 24,000 chars; set `truncated: true` when cut. Do not return Prose JSON. |
| `create_document` | write | `type` is always `common`. Args: `title` (1–200), optional `content` (≤ 20,000), optional `folderId`. Plain text becomes a Prose doc via the shared `proseFromText`. Call `DocsService.create`. |
| `update_document` | write | Args: `docId`, and at least one of `title`, `content` (≤ 20,000), `folderId` (`null` clears). Same Prose conversion as `update_doc` for common docs. Call `DocsService.update`. |
| `list_spaces` | read | `SpacesService.list(workspaceId)`. |
| `list_tasks` | read | `ListTasksQuerySchema`: `spaceId`, or `epicId`, or both `scheduleFrom` and `scheduleTo`. Call `TasksService.list`. Strip `actualTime` from each row. |
| `get_task` | read | `TasksService.get`. Omit `actualTime`. |
| `create_task` | write | `CreateTaskBodySchema`, including required `estimation` (positive int, minutes). Call `TasksService.create`. Response omits `actualTime`. |
| `update_task` | write | `taskId` plus `UpdateTaskBodySchema` fields. At least one field. Call `TasksService.update`. Response omits `actualTime`. |
| `get_task_context` | read | Assemble the bundle in **Unified context** below. |
| `submit_execution_result` | write | Insert one result row. Do not update the task. |

3. Tool arguments are Zod-strict. `workspaceId` and `userId` in arguments are rejected.
4. Read tools require scope `todex:read` or `todex:write`. Write tools require `todex:write`.
5. Writes run immediately in the request. Do not create an agent job, do not set `awaiting_confirmation`, and do not call `ToolExecutionLayer`.
6. Document and task text is data. Do not interpret tool inputs as instructions to the server.
7. MCP tool errors are `{ isError: true, content: [{ type: "text", text }] }` with a short message. Map `BadRequestException` and Zod issues to 200 + that payload (invalid args). Map unknown workspace resources to the same not-found message used for forbidden ids (`ForbiddenException` from services), so callers cannot probe other workspaces. Unexpected exceptions return `Tool failed` and are logged without args, document bodies, or the bearer token.

## Technical requirements

Enough detail for `/create-task` or `/generic-task` to implement without guessing.

### Architecture

Todex MCP is an interface on `apps/todex-api`. One Nest process. Postgres stays the source of truth.

**Do not reuse these as the MCP runtime**

- `ContextService` (`apps/todex-api/src/modules/agent/context/context.service.ts`) builds an LLM transcript (system prompt, memories, chunks, conversation). It is not task context. Leave it.
- `ToolRegistry` / `ToolExecutionLayer` are bound to agent jobs, runs, and the confirmation gate. MCP tools must not be registered there. In-app names stay `list_docs`, `get_doc`, `create_doc`, `update_doc`.
- `McpRegistration` / `McpClient` are the outbound client for `MCP_SERVER_URL`. Do not invert them into the server.
- `doc_tasks` is the goal link. `TasksService.writeTaskGoal` deletes every `doc_tasks` row for a task before inserting the goal. Do not store execution results or extra knowledge links there.

**Reuse**

- `DocsService`, `TasksService`, `SpacesService`, `FoldersService` (folder checks already inside docs), `EpicsService` only to read an epic by id for context.
- `ChunksRepository.search` and `EmbeddingClient` for `search_knowledge` and the context retriever.
- `WorkspaceGuard` membership rule: load `workspace_members` for the user; 0 memberships run `ensureOwnerWorkspace`; not exactly one membership → 403 `Expected exactly one workspace membership`. Workspace id comes only from that row.
- `proseFromText` in `doc-tool-handler.ts`. Move it to `apps/todex-api/src/modules/docs/prose-from-text.ts` and call it from `DocToolHandler` and the MCP doc tools.
- Nest `Logger`. `HttpExceptionFilter` stays on HTTP routes. MCP uses the SDK error shape above.
- Better Auth 1.3.8 already mounted at `/api/auth` (`apps/todex-api/src/auth.ts`). Google login stays the user identity.

**New modules**

```
apps/todex-api/src/modules/mcp/
  mcp.module.ts                 imports Docs, Tasks, Spaces, Epics, agent chunks/embeddings
  mcp-auth.ts                   Bearer → userId, scopes, workspaceId
  mcp-http.ts                   stateless Streamable HTTP on the Express adapter
  mcp-tools.ts                  Zod schemas + handlers
  task-context.service.ts       get_task_context
  execution-results.service.ts  insert + list recent for a task
apps/todex-api/src/db/         drizzle table + migration
apps/todex-web/src/app/oauth/consent/page.tsx
apps/todex-web/src/app/settings/mcp-access.tsx
```

Register `McpModule` in `AppModule`. Mount HTTP in `main.ts` on `app.getHttpAdapter().getInstance()` at `/mcp`. `bodyParser` is already disabled. Exclude `/mcp` and `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` from the `v1` prefix, same as `api/auth`.

SDK: `@modelcontextprotocol/sdk` in `apps/todex-api`. Use `StreamableHTTPServerTransport` in stateless mode (new transport per request, or the SDK’s stateless option if that version has it). Tool results are JSON text content. Add the dependency with pnpm from the app. Do not add `@vercel/mcp-adapter`.

**Import boundaries**

MCP code stays in `apps/todex-api`. Shared Zod request/response types stay in `@repo/api/todex` only when the HTTP API already owns them (`CreateTaskBodySchema`, `UpdateTaskBodySchema`, `ListTasksQuerySchema`, doc bodies). MCP-only tool schemas live next to `mcp-tools.ts`. No app-to-app imports.

**Decisions**

- Human approval of a tool call is the MCP client’s (Cursor asks before running a tool). The server authorizes the token and runs the tool. The in-app pause (`awaiting_confirmation` in `AgentOrchestrator`) stays for the embedded agent only.
- OAuth and personal access tokens are both accepted on `/mcp`. After resolution they share one authorization path: user id, scopes, single workspace.
- `get_task_context` is a new assembler. It may call `ChunksRepository`. It must not call `ContextService.assemble`.

### Data layer

**Schema changes**

`task_execution_results`:

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | text pk | `randomUUID()` |
| `workspace_id` | text not null | fk `workspaces.id` on delete cascade |
| `task_id` | text not null | fk `tasks.id` on delete cascade |
| `user_id` | text not null | fk `users.id` |
| `summary` | text not null | 1–8,000 chars |
| `outcome` | enum `implemented`, `blocked`, `partial` | |
| `artifact_urls` | jsonb `string[]` not null default `[]` | max 20 http(s) URLs, each ≤ 2,000 chars |
| `decisions` | text not null default `''` | ≤ 8,000 chars |
| `created_at` | timestamptz not null | |

Index `(workspace_id, task_id, created_at)`.

Better Auth MCP plugin (OIDC provider schema) and API-key plugin tables: generate with `@better-auth/cli` against the existing Drizzle auth schema, then check in a Drizzle migration. Do not hand-maintain a second copy of those tables.

**Migration**

One Drizzle migration for `task_execution_results` plus the Better Auth tables the CLI adds. No backfill.

**Queries**

- Insert result only after `TasksService` has confirmed the task is in the caller’s workspace (`require` via `tasks.get`, which already 403s on a foreign id).
- List for context: last 5 rows for that task and workspace, newest first. Columns: id, summary, outcome, artifactUrls, decisions, createdAt, userId. No join to `execution_sessions` or `execution_session_tasks`.

### API & contracts

**MCP**

- Resource identifier: `${env.api.baseUrl}/mcp`.
- `POST` / `GET` / `DELETE /mcp`.
- Discovery: `GET /.well-known/oauth-authorization-server` via `oAuthDiscoveryMetadata(auth)`, and `GET /.well-known/oauth-protected-resource` via `oAuthProtectedResourceMetadata(auth)` from `better-auth/plugins`.

**Auth configuration** (`apps/todex-api/src/auth.ts`)

Stay on `better-auth` 1.3.8. Add plugins from `better-auth/plugins`:

- `mcp({ loginPage, consentPage, oidcConfig })`.
- `apiKey()` for personal access tokens.

`loginPage` is `${env.web.baseUrl}/sign-in`. `consentPage` is `${env.web.baseUrl}/oauth/consent`. If 1.3 accepts only relative paths, add an API redirect that 302s those paths to the web origin. Do not rebuild login.

OIDC config for this MVP:

- Authorization code + PKCE S256 required.
- Public clients (`token_endpoint_auth_method: none`).
- Dynamic client registration enabled.
- Scopes `todex:read` and `todex:write`. No trusted client skips consent.
- Refresh tokens allowed (`offline_access`) so Cursor can reconnect.
- Do not enable client-credentials. There is no shared administrator token.

**Bearer resolution** (`mcp-auth.ts`)

1. Read `Authorization: Bearer`.
2. `auth.api.getMcpSession({ headers })`. On success, user id and granted scopes come from that session.
3. Otherwise verify the API key (`auth.api.verifyApiKey` or the 1.3 equivalent). Map key permissions `{ mcp: ["read"] }` to `todex:read` and `{ mcp: ["read", "write"] }` to both scopes.
4. Otherwise 401 and `WWW-Authenticate: Bearer resource_metadata="<protected-resource url>"`.
5. Resolve workspace with the `WorkspaceGuard` rule. 403 when it is not exactly one membership.

**Settings / token API**

Use the Better Auth API-key endpoints under `/api/auth`. The settings UI calls them with the session cookie. Server-side, only the logged-in user can create and revoke their own keys. A new key is shown once. Store only the hash. Prefix displayed keys with `tdx_`. Default expiry 90 days. User picks read-only (`mcp: ["read"]`) or read-write (`mcp: ["read", "write"]`).

No new Nest REST resource for tokens or execution results. Results are MCP-only in this MVP. The web app can read them later.

**Shared types**

Add the outcome enum next to the table in `schema.ts`. Do not put MCP tool schemas in `@repo/api`.

**Validation**

Zod at the tool boundary, `.strict()`. Reuse `CreateTaskBodySchema`, `UpdateTaskBodySchema`, and `ListTasksQuerySchema` from `@repo/api/todex`. Reject non-https and non-http artifact URLs. Reject `workspaceId` on every tool.

### Frontend

- **Routes:** existing `/sign-in`. New `/oauth/consent` on `apps/todex-web`. Existing `/settings`.
- **Consent page:** show client name, requested scopes (`todex:read`, `todex:write`), Allow and Deny. Complete the Better Auth MCP consent redirect. Match current settings layout (Tailwind, no new styling system). Require a session; otherwise send the user through `/sign-in` and return.
- **Settings:** `mcp-access.tsx` on the settings page, beside `GoogleCalendarSettings`. Create a token (name, scope, shown once), list name, prefix, scopes, expiry, revoke.
- **State:** client components calling the existing auth client. Add the `apiKey` client plugin in `apps/todex-web/src/lib/auth-client.ts`.
- **Styling:** Tailwind. No styled-components. No new Radix Themes wrappers.

### Auth & permissions

- Caller is the token’s user. Tools inherit that user’s workspace membership. Owner and member are the same for these tools, matching the HTTP API.
- Read scope cannot call write tools (403-equivalent tool error: `Missing scope todex:write`).
- Cross-workspace ids fail inside the existing services (`ForbiddenException`). MCP surfaces that as not found for the caller’s workspace.
- Do not read `execution_sessions`, `execution_session_tasks`, `execution_current`, or `execution_queue` from any MCP tool. When a service returns `actualTime`, delete that field before the MCP response is serialized.
- OAuth consent is mandatory. PATs are created only by the signed-in user in Settings.

### Unified context

`TaskContextService.get(workspaceId, taskId)`:

1. Load the task (`TasksService.get`). Omit `actualTime`.
2. If `goalId` is set, `DocsService.get` and include title, docKey, type, and plain text (cap 8,000 chars per doc).
3. Docs whose `doc_mentions` row has `target_type = task` and `target_id = taskId`, same plain-text cap, max 10 docs. Skip the goal if it is already included.
4. If `epicId` is set, include epic id, name, description, status, priority from the epics service. Epic must belong to the task’s space.
5. If `parentTaskId` is set, include parent id, taskKey, summary, status, priority. Omit `actualTime`. Do not recurse.
6. Last 5 `task_execution_results` for this task.
7. Embed `${summary}\n${description}` and `ChunksRepository.search(..., 8)`. Keep `sourceType` of `doc` or `task`. Drop the chunk whose `sourceId` is this task. Snippet ≤ 500 chars.
8. Serialize to JSON. If the string exceeds 24,000 characters, drop retrieved chunks first, then shorten doc plain text, until it fits. Set `truncated: true` when anything was dropped or shortened.
9. On embedding failure, still return steps 1–6 and set `retrievalError` to a short message. Do not fail the whole tool.

### Error handling & edge cases

| Case | Result |
| ---- | ------ |
| No bearer / bad token | HTTP 401 + `WWW-Authenticate` |
| Read token calls a write tool | Tool error `Missing scope todex:write` |
| User without exactly one workspace | HTTP 403 |
| Zod failure | Tool error listing issue paths |
| `workspaceId` in args | Tool error `workspaceId is not allowed` |
| Unknown or foreign task/doc/space | Tool error `Not found` |
| `update_document` / `update_task` with no fields | Tool error `No changes` |
| `create_document` content over 20,000 chars | Zod error |
| Embedding provider down during search | Tool error `Knowledge search unavailable` |
| Embedding provider down during context | Partial context + `retrievalError` |
| Task deleted before result insert | `Not found` |

Do not log bearer tokens, raw tool arguments, or document bodies. Log tool name, user id, workspace id, and error class.

### Testing

**Unit** (`*.test.ts` next to the module, Vitest, same style as `doc-tool-handler.test.ts`):

- Zod rejects extra keys, missing filters on `list_tasks`, empty updates, `workspaceId`, oversized content, bad artifact URLs.
- Scope check: read token cannot write.
- Serializer drops `actualTime`.
- Context truncates over the 24,000 character cap by dropping chunks first.
- `submit_execution_result` does not call task update (service mock only in this unit test).

**Integration** (`apps/todex-api/test/mcp.e2e-spec.ts`, Vitest + supertest, real `DocsService` and `TasksService`, local Postgres from the app’s docker compose):

Do not mock those services. Seed two users, two workspaces, a space, a task, and a common doc. Insert API key rows (or call the auth API) for a read-write token, a read-only token, and a token for the other workspace.

- 401 without a bearer.
- Read token: `get_document` and `get_task` succeed; `create_document` and `update_task` fail on scope.
- Write token: create doc, update doc, create task with estimation and epic id, update task, `get_task_context` includes the linked goal and omits `actualTime`, `submit_execution_result` inserts a row and leaves `status` unchanged, then `update_task` with `status: done` changes it.
- Other workspace’s task id and doc id return not found.
- A task that has execution intervals still returns no `actualTime`, intervals, or session ids from `get_task` and `get_task_context`.

**E2E:** no Playwright. The integration file is the end-to-end check.

**Manual**

- OAuth connect from Cursor (or MCP Inspector) against a dev API, consent on `/oauth/consent`, `get_task_context`, `submit_execution_result`, confirm the row in Postgres and the task status unchanged until an explicit `update_task`.
- Create a PAT in Settings, put it in Cursor `mcp.json`, same two calls.
- Confirm the in-app agent still pauses on `create_task` and that `MCP_SERVER_URL` registration is unchanged.

### Deployment & ops

**Env vars**

None required beyond existing `BETTER_AUTH` secret, `API` base URL, and web base URL. Resource URL is derived from `env.api.baseUrl`. Declare any new name in `turbo.json` `globalEnv` if one is added. Do not add a shared admin token.

**Scripts**

- Drizzle migrate as the app already does.
- `@better-auth/cli` generate/migrate for plugin tables, then fold the SQL into the Drizzle migration so deploy stays one command.

**Rollout**

Ship behind the new routes. No feature flag. Existing web session cookies keep working. Document in `apps/todex-api/README.md` a section **Inbound MCP** that is separate from the existing `MCP_SERVER_URL` paragraph:

```json
{
  "mcpServers": {
    "todex": {
      "url": "http://localhost:<port>/mcp",
      "headers": { "Authorization": "Bearer tdx_<token>" }
    }
  }
}
```

Also document the OAuth connect path (client opens `/mcp`, follows 401 metadata, user signs in with Google and consents). List the 11 tools in one sentence each. Include one `get_task_context` call (`{ "taskId": "<id>" }`) and one `submit_execution_result` call (`taskId`, `summary`, `outcome`, `artifactUrls`, `decisions`) and state that completion is a separate `update_task`.

### UX / UI

Consent and Settings only. No change to Planning or Knowledge screens. Empty token list says the user has no MCP tokens. Revoke confirms. The secret is shown once with a copy control; after navigation it is gone.

## Dependencies & risks

- Better Auth 1.3.8 MCP plugin is the OIDC-based plugin in `better-auth/plugins`, not the later `@better-auth/mcp` package. Do not upgrade Better Auth in this MVP. If `getMcpSession` or API-key verify signatures differ from the 1.3 docs, adapt the calls and keep the HTTP contract in this PRD.
- Dynamic client registration is required for Cursor and Claude remote connect. Consent still runs for every new client.
- Semantic search depends on the existing embedding client. Context still returns structured task data when embeddings fail. `search_knowledge` does not.
- `actualTime` is computed inside `TasksService.withGoalIds`. Stripping it in the MCP serializer is mandatory. Do not change the web API in this PRD.
- Execution sessions have no `user_id` today and are workspace-scoped. MCP must not expose them. This PRD does not remodel execution privacy for the web app.

## Open questions

- [ ] None for this MVP.

## Success criteria

- An external client completes OAuth or presents a PAT and receives a workspace-scoped MCP session.
- It creates and updates a Knowledge doc that shows up in Todex.
- Cursor loads `get_task_context` for a real task without manual copy, submits a result, and Todex stores that row.
- Task status is unchanged by the result submission.
- A second workspace’s ids and all execution-session fields stay inaccessible.
- In-app agent confirmation and outbound `MCP_SERVER_URL` still behave as they do today.

## Implementation checklist

- [ ] Add `@modelcontextprotocol/sdk` to `apps/todex-api`.
- [ ] Enable Better Auth `mcp` and `apiKey` plugins. Generate plugin tables. Add Drizzle migration for those tables and `task_execution_results`.
- [ ] Mount `/.well-known/*` discovery routes and stateless `/mcp`, excluded from the `v1` prefix.
- [ ] Implement `mcp-auth.ts` (OAuth session, then PAT, then workspace membership, then scopes).
- [ ] Move `proseFromText` to `modules/docs/prose-from-text.ts`. Keep `DocToolHandler` on it.
- [ ] Implement the 11 tools on `DocsService`, `TasksService`, `SpacesService`, `ChunksRepository`, `TaskContextService`, and `ExecutionResultsService`. Strip `actualTime`. Reject `workspaceId` arguments.
- [ ] Add `/oauth/consent` and Settings token management on `todex-web`. Wire the auth client `apiKey` plugin.
- [ ] Unit tests and `test/mcp.e2e-spec.ts` against real services and Postgres.
- [ ] README **Inbound MCP** section with Cursor `mcp.json`, OAuth steps, tool list, and the two example calls.
- [ ] Manual run: OAuth or PAT → `get_task_context` → `submit_execution_result` → status still not done → `update_task` sets done. Confirm in-app agent write confirmation still pauses.
