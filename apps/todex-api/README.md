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

`completed` with a new task means the model emitted `create_task`. `completed` with only assistant text and no new task means `llama3.1:8b` answered in prose. Check Ollama is up (`curl -s http://localhost:11434/api/tags`) and retry once. If it still never calls the tool, set `AI_MODEL=qwen2.5:7b` after `ollama pull qwen2.5:7b`.

`GET /health` must report Postgres and Redis up. Unit tests do not need either service or Ollama: `pnpm --filter todex-api test`.

Same `idempotencyKey` on a second message POST in that conversation returns the original job. Omit the key to start a new turn. A worker retry of the same job must not insert a second task for the same tool call.
