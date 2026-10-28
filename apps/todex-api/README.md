# Todex API (Nest)

Local Postgres (port **5434**) and Redis (port **6379**): `docker compose up -d`. The agent also needs host Ollama — see below.

```bash
cp .env.example .env.local
# fill GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / BETTER_AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Google OAuth callback: `http://localhost:8091/api/auth/callback/google`

From repo root: `pnpm dev:todex` (starts API + web after `@repo/api` / `@repo/ui` build).

## Agent jobs (local Ollama)

Spec: `docs/prd/TDX/ai-agent.md`. A conversation holds the transcript. Each message enqueues a job. Each worker attempt is an agent run. Task CRUD is the first tool pack and the smoke test below. Ollama stays on the host. Postgres and Redis come from Compose.

```bash
# host
ollama serve
ollama pull llama3.1:8b   # skip if you already have it
ollama pull nomic-embed-text

# apps/todex-api
docker compose up -d      # Postgres :5434, Redis :6379
pnpm db:migrate
pnpm dev
```

`.env.local` (defaults match a host Ollama):

```bash
REDIS_URL=redis://localhost:6379
AI_PROVIDER=local
AI_MODEL=llama3.1:8b
AI_EMBEDDING_MODEL=nomic-embed-text
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
```

Sign in through the web app (`pnpm dev:todex` from the repo root) so the browser has a Better Auth session. Then, from that browser origin (`http://localhost:3002`):

```bash
curl -s -c /tmp/todex.cookies -b /tmp/todex.cookies \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3002' \
  -X POST http://localhost:8091/v1/agent/conversations

curl -s -b /tmp/todex.cookies \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3002' \
  -X POST http://localhost:8091/v1/agent/conversations/<conversationId>/messages \
  -d '{"message":"Create a task called Agent smoke test on board <boardId>."}'
```

Poll until `status` is `completed` or `failed`. `run.outcomeText` is the assistant text:

```bash
curl -s -b /tmp/todex.cookies \
  -H 'Origin: http://localhost:3002' \
  http://localhost:8091/v1/agent/jobs/<jobId>
```

Transcript, including tool messages:

```bash
curl -s -b /tmp/todex.cookies \
  -H 'Origin: http://localhost:3002' \
  http://localhost:8091/v1/agent/conversations/<conversationId>
```

Confirm the write with the existing tasks API:

```bash
curl -s -b /tmp/todex.cookies \
  -H 'Origin: http://localhost:3002' \
  'http://localhost:8091/v1/tasks?boardId=<boardId>'
```

The same conversation can create a doc. `create_doc` takes `type` `common` or `goal`, plain-text `content`, and `folderName` for a docs folder. Confirm with `GET /v1/docs/:id`.

`create_calendar_event` takes `title`, ISO `start` and `end`, and an IANA `timeZone`. Confirm with `GET /v1/calendar/events?from=...&to=...`.

`completed` with a new task means the model emitted `create_task`. `completed` with only assistant text and no new task means `llama3.1:8b` answered in prose. Check Ollama is up (`curl -s http://localhost:11434/api/tags`) and retry once. If it still never calls the tool, set `AI_MODEL=qwen2.5:7b` after `ollama pull qwen2.5:7b`.

`GET /health` must report Postgres and Redis up. Unit tests do not need either service or Ollama: `pnpm --filter todex-api test`.

Same `idempotencyKey` on a second message POST in that conversation returns the original job. Omit the key to start a new turn. A worker retry of the same job must not insert a second task for the same tool call.

A completed run enqueues a separate memory job. That job may store short workspace facts from the transcript. The next turn includes those memories after the system prompt and before the transcript.

Saving or deleting a doc or task enqueues a chunk job. That job reads the text through the doc or task service, embeds each chunk with `AI_EMBEDDING_MODEL` (768 dimensions, `nomic-embed-text` on Ollama), and replaces `agent_documents` / `agent_chunks` for that source. A chat turn embeds the latest user message with the same model and inserts the closest workspace chunks after memories and before the transcript. The model still does not query Postgres.

`POST /v1/agent/conversations/:id/messages` takes optional `mode`: `execute` (default) or `ask`. Ask sends only read tools and cannot change workspace data. A `create_`, `update_`, or `delete_` tool call in execute mode pauses the job at `awaiting_confirmation`. Approve, reject, or allow it with `POST /v1/agent/jobs/:id/confirmation` and `{ "decision": "approve" | "reject" | "allow" }`. Allow remembers that tool and those arguments for this user in this workspace. Read tools still run immediately. Set `MCP_SERVER_URL` to register that server's tools on startup.

Postgres comes from `pgvector/pgvector:pg15`. Recreate the db container after pulling that image (`docker compose up -d` in `apps/todex-api`). The existing `pgdata` volume stays. Apply the migration with `pnpm --filter todex-api db:migrate` before relying on memories or chunks.

## Inbound MCP

`POST /mcp` is Todex acting as an MCP server for Cursor, Claude, and ChatGPT. It is separate from `MCP_SERVER_URL`, which is an outbound client the in-app agent uses to call someone else's tools. Inbound calls use a Bearer token. They do not use the in-app confirmation gate. A write runs immediately as the token's user, in that user's single workspace. Do not send `workspaceId`.

Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "todex": {
      "url": "http://localhost:8091/mcp",
      "headers": { "Authorization": "Bearer tdx_..." }
    }
  }
}
```

Create the token in Todex Settings. It is shown once, prefixed `tdx_`, and expires in 90 days. Pick read-only or read-write. Revoke it there. OAuth: the client discovers `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`, registers, and sends the user to `/api/auth/oauth2/authorize`. After Google sign-in, `/oauth/consent` asks before the code is issued. Scopes are `todex:read` and `todex:write`. Write includes read.

Tools:

- `search_knowledge` — semantic search over Knowledge docs.
- `get_document` — one doc as plain text.
- `create_document` — a common Knowledge doc from plain text.
- `update_document` — title, plain text, or folder.
- `list_spaces` — spaces in the caller's workspace.
- `list_tasks` — by `spaceId`, `epicId`, or a schedule range.
- `get_task` — one task, without `actualTime`.
- `create_task` — `estimation` is required minutes.
- `update_task` — the only way to change status, including `done`.
- `get_task_context` — one task plus goal, mentioning docs, epic, parent, last five execution results, and retrieved chunks. Capped at 24,000 characters.
- `submit_execution_result` — stores a summary. Does not mark the task done.

```json
{ "name": "get_task_context", "arguments": { "taskId": "…" } }
```

```json
{
  "name": "submit_execution_result",
  "arguments": {
    "taskId": "…",
    "summary": "Handler is in todex-api",
    "outcome": "implemented",
    "artifactUrls": ["https://example.com/pr/1"]
  }
}
```

Completion is a separate `update_task` with `{ "taskId": "…", "status": "done" }`.
