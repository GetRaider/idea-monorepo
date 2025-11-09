# Idea Monorepo

A repository where I invent, test, and validate product ideas. This monorepo contains multiple applications and shared packages, serving as a space to experiment with new concepts, build prototypes, and showcase development work.

## Projects

This repository includes the following applications and packages:

### Apps and Packages

    .
    ├── apps
    │   ├── devinity-api              # NestJS API for engineering management app
    │   ├── devinity-web              # Next.js web application for engineering management
    │   └── take-and-do              # Next.js productivity management app
    └── packages
        ├── @repo/api                 # Shared NestJS resources
        ├── @repo/eslint-config       # ESLint configurations (includes Prettier)
        ├── @repo/jest-config         # Jest configurations
        ├── @repo/typescript-config   # `tsconfig.json`s used throughout the monorepo
        └── @repo/ui                  # Shareable React component library

Each package and application are 100% [TypeScript](https://www.typescriptlang.org/) safe.

### Tech Stack

The repository uses modern development tools and practices:

- [Node.js](https://nodejs.org/) runtime for all applications
- [TypeScript](https://www.typescriptlang.org/) for static type-safety
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://jestjs.io) & [Playwright](https://playwright.dev/) for testing

### Development Commands

#### Build

```bash
# Build all apps and packages
pnpm run build

# Note: If building apps individually, build packages first
```

#### Develop

```bash
# Start development servers for all apps
pnpm run dev

# Run in production mode
pnpm run prod
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
