# Devinity Web

Frontend web application for Devinity, an engineering management platform. Built with Next.js and React.

## Getting Started

> 🏁 This app depends on the [devinity-api](../devinity-api/README.md) server. Make sure your API server is running.

Run the development server:

```bash
pnpm run dev
```

Open [localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

To create [API routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) add an `api/` directory to the `app/` directory with a `route.ts` file.

### ⚠️ Note about build

If you plan to only build this app, make sure you've built the packages first.

## Development

This web application is part of the Devinity engineering management application. It provides the user interface for managing engineering teams, projects, and workflows.

## Available Scripts

- `pnpm dev` - Start development server (port 3001)
- `pnpm build` - Build for production
- `pnpm prod` - Run production server (port 10000)
- `pnpm test` - Run tests
- `pnpm test:e2e` - Run end-to-end tests with Playwright
- `pnpm lint` - Lint code
