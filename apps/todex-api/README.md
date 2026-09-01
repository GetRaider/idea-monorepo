# Todex API (Nest)

Local Postgres: `docker compose up -d` (port **5434**). No Redis.

```bash
cp .env.example .env.local
# fill GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / BETTER_AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Google OAuth callback: `http://localhost:8091/api/auth/callback/google`

From repo root: `pnpm dev:todex` (starts API + web after `@repo/api` / `@repo/ui` build).
