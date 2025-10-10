# Devinity API

A modern NestJS API with PostgreSQL and Redis integration.

## Features

- 🚀 NestJS framework
- 🐘 PostgreSQL database with Drizzle ORM
- 🔴 Redis caching and session management
- 🔐 Authentication with Better Auth
- 🐳 Docker Compose for local development

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Services

Start PostgreSQL and Redis:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL on port `5432`
- Redis on port `6379`

### 3. Set Environment Variables

Create a `.env.local` file (see `.env` for required variables):

```env
WEB_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8090
PORT=8090
DEV_DB_URL=postgresql://postgres:password@localhost:5432/devdb
REDIS_HOST=localhost
REDIS_PORT=6379
# ... other variables
```

### 4. Run Migrations

```bash
pnpm db:migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

The API will be available at [http://localhost:8090](http://localhost:8090).

## Redis Integration

Redis is fully integrated for caching and advanced data operations. See [REDIS_GUIDE.md](./REDIS_GUIDE.md) for detailed usage instructions.

### Quick Example

```typescript
// Cache Manager (high-level)
const users = await this.cacheManager.get("users:all");

// Direct Redis (advanced)
const count = await this.redis.incr("user:123:login_count");
```

## Project Structure

```
src/
├── db/
│   ├── client.ts           # Database client
│   ├── database.module.ts  # Database module
│   ├── redis.module.ts     # Redis client module
│   ├── cache.module.ts     # Cache Manager module
│   └── schema.ts          # Drizzle schema
├── modules/
│   ├── app.module.ts      # Main application module
│   └── user/              # User module
├── auth.ts                # Authentication setup
└── main.ts               # Application entry point
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm prod` - Run production build
- `pnpm test` - Run tests
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations

### ⚠️ Note about build

If you plan to only build this app, make sure you've built the packages first.

## Learn More

To learn more about NestJs, take a look at the following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)
