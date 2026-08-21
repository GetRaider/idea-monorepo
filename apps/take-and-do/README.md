# Take and Do

A productivity management application built with Next.js and React. Organize tasks, manage workflows, and boost productivity with an intuitive interface.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose
- [Ollama](https://ollama.com) (optional, for local AI)

### 1. Install dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Start local services

From this directory:

```bash
docker compose up -d
```

This starts PostgreSQL on port `5433` (database: `take_and_do`).

### 3. Local AI (optional)

Install and run [Ollama](https://ollama.com) on the host (uses Metal GPU on macOS — much faster than Docker):

```bash
ollama pull llama3.1:8b
ollama serve
```

The app expects `AI_BASE_URL=http://localhost:11434/v1` (see `.env.example`).

### 4. Environment variables

Copy `.env.example` to `.env` and fill in the remaining values:

```bash
cp .env.example .env
```

Required for local development:

- `BETTER_AUTH_SECRET` — any random string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth credentials

`DB_CONNECTION_STRING` in `.env.example` matches the Docker Compose Postgres service.

### 5. Run migrations

Required on first setup (and after pulling new migrations):

```bash
pnpm db:migrate
```

This creates all tables including Better Auth (`user`, `session`, `account`, `verification`).

### 6. Start the app

From the monorepo root:

```bash
pnpm dev:take-and-do
```

Or from this directory:

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

### Note about build

If you plan to only build this app, make sure you've built the packages first.

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production with Turbopack
- `pnpm prod` - Start production server
- `pnpm lint` - Lint code
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Apply Drizzle migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm docker:up` - Start Docker Compose services
- `pnpm docker:down` - Stop Docker Compose services
