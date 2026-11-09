# Evolin API

Local NestJS API for Evolin. Postgres and the API run in Docker. Expo Web stays on the host.

```bash
docker compose -f apps/evolin-api/docker-compose.yml up -d --build
docker compose -f apps/evolin-api/docker-compose.yml exec api pnpm --filter evolin-api db:migrate
pnpm dev:evolin
```

Migrate before opening the app. The API boots without applying migrations; the first query fails until they are applied.

API: `http://localhost:8092`  
Postgres (host tools): `postgresql://postgres:password@localhost:5435/evolin`
