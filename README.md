# Idea Monorepo

A repository where I invent, test, and validate product ideas. This monorepo contains multiple applications and shared packages, serving as a space to experiment with new concepts, build prototypes, and showcase development work.

## Projects

This repository includes the following applications and packages:

- [Take&Do](https://take-and-do.vercel.app/)

### Apps and Packages

    .
    ├── apps
    │   ├── devinity-api              # Nest.js API for the Devinity (AI Engineering Management app)
    │   ├── devinity-web              # Next.js WEB for the Devinity (AI Engineering Management app)
    │   └── take-and-do               # Next.js full-stack app for the Take&Do (AI Productivity Management app)
    └── packages
        ├── @repo/api                 # Shared Nest.js resources
        ├── @repo/eslint-config       # ESLint configurations (includes Prettier)
        ├── @repo/shared              # Shared TS utilities/modules used across apps
        ├── @repo/vitest-config       # Vitest configurations
        ├── @repo/typescript-config   # `tsconfig.json`s used throughout the monorepo
        └── @repo/ui                  # Shareable React component library

Each package and application are 100% [TypeScript](https://www.typescriptlang.org/) safe.

### Tech Stack

The repository uses modern development tools and practices:

- [Node.js](https://nodejs.org/) runtime for all applications
- [TypeScript](https://www.typescriptlang.org/) for static type-safety
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Vitest](https://vitest.dev) & [Playwright](https://playwright.dev/) for testing

### Development Commands

#### Build

```bash
# Build all apps and packages
pnpm run build

# Rebuild (clean + build)
pnpm run rebuild
```

#### Develop

```bash
# Start development servers for all apps
pnpm run dev

# Start only Devinity (+ required packages)
pnpm run dev:devinity

# Start only Take&Do (+ required packages)
pnpm run dev:take-and-do

# Run in production mode
pnpm run prod

# Run Take&Do in production mode (+ required packages)
pnpm run prod:take-and-do
```

#### Test

```bash
# Run all test suites
pnpm run test

# Run end-to-end tests
pnpm run test:e2e
```

#### Lint

```bash
# Lint all apps and packages
pnpm run lint
```

#### Format

```bash
# Format all TypeScript and Markdown files
pnpm format
```

#### Code Check

```bash
# Run TypeScript type checking and linting
pnpm run codeCheck
```

#### Clean

```bash
# Remove build outputs (via Turborepo)
pnpm run clean

# Remove build outputs + root node_modules
pnpm run clean:hard
```
