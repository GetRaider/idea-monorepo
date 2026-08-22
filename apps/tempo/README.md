# Tempo

Personal Electron focus timer and stopwatch.

## Dev

From repo root:

```bash
pnpm dev:tempo
```

From this app:

```bash
pnpm dev
```

## macOS install (local)

```bash
pnpm --filter tempo install:mac
```

Copies `Tempo.app` to `/Applications`. Open it once, then right-click the Dock icon → Keep in Dock.

## Data

SQLite database and settings live under Electron user data:

`~/Library/Application Support/Tempo/tempo.sqlite`

Legacy data from the previous `focuzer` app folder is migrated on first launch when possible.
