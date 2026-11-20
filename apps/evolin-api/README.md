# Evolin API

Local NestJS API for Evolin. Postgres runs in Docker. The API runs on the host.

```bash
pnpm docker:evolin
pnpm dev:evolin
```

`pnpm docker:evolin` starts Postgres and applies migrations. `pnpm dev:evolin` starts the API and Expo Web. Migrate before opening the app. The API boots without applying migrations; the first query fails until they are applied.

API: `http://localhost:8092`  
Postgres: `postgresql://postgres:password@localhost:5435/evolin`
