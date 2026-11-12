# Airove — Native AI Hub POC

A macOS Electron experiment for using existing ChatGPT and Claude subscriptions through their official websites. No model APIs, backend, chat storage or scraping. This POC establishes compatibility; it does not assume agentic workflows work inside Electron.

## Development

Use the repository's Node version (20.18+), pnpm 10.9.0 and existing workspace lockfile:

```sh
pnpm install
pnpm dev:airove
pnpm --filter airove build
pnpm --filter airove typecheck
pnpm --filter airove lint
pnpm --filter airove test
```

Run locally on macOS with a graphical desktop. Production packaging is out of scope.

## Architecture

Follows Tempo's electron-vite main/preload/renderer/shared layout, React, Tailwind 3 and shared ESLint/TypeScript configs. The small app-local toolbar avoids pulling in unrelated shared UI dependencies. Root `dev:airove` uses Turborepo; workspace discovery already covers `apps/*`.

The main process owns two persistent `WebContentsView` instances, with `persist:chatgpt` and `persist:claude` sessions under the separate `airove` user-data directory. Only the selected view is attached below a fixed 104px toolbar. Detaching a view preserves its document and navigation state; background throttling is disabled to reduce interruptions, though providers can still suspend tasks. Closing the window closes both views; macOS activation recreates them with persisted cookies, not previous page state.

The sandboxed local preload exposes only state, provider selection, navigation and state subscription. Main validates the sender webContents, main frame, exact local renderer URL and operation arguments. Remote views and authentication popups have no application preload or Node access. Known official authentication hosts can navigate inside the isolated provider session. Other HTTPS links require confirmation before opening externally; redirects to unlisted hosts are blocked. Additional legitimate auth hosts should be investigated and explicitly added, never worked around by disabling security.

## Security and capabilities

- Context isolation, sandbox, web security and certificate validation stay enabled.
- Permissions default to denied. Only a top-level official provider origin in an owned webContents can request media, clipboard or fullscreen permission; the user must approve. Grants last for the window session. Other origins and embedded frames are denied.
- File inputs use Chromium's native picker; downloads use Electron's normal save behavior. No custom file access bridge.
- macOS microphone/camera approval is separate from site permission. A future packaged build needs usage descriptions and appropriate signing/entitlements; this POC does not include packaging.
- No DOM inspection, injected scripts, credential handling, cookie inspection or chat persistence.
- Navigation logs contain event, provider, redacted URL, loading/conversation state, timestamp and numeric errors. Titles and URL query/fragment data are not logged. The toolbar shows provider paths (including conversation IDs), strips queries/fragments, and reduces authentication URLs to their origin. Page titles are transient tooltip state only.
- Persistent browser profiles contain provider-managed cookies and site data. They remain local and independent; Airove does not synchronize them. External browsers use independent sessions.

## Manual compatibility checklist

All account-dependent scenarios below are **unverified** until exercised with real accounts on macOS. Record date, OS/Electron version, provider/account entitlement, auth method, observed result and limitation. Do not record credentials, tokens, private chats or OAuth callback URLs.

| Scenario                                               | ChatGPT                 | Claude                  |
| ------------------------------------------------------ | ----------------------- | ----------------------- |
| Website opens inside Electron                          | Not yet tested on macOS | Not yet tested on macOS |
| Supported sign-in method and authentication popup      | Not tested              | Not tested              |
| Restart: authentication persists, sessions independent | Not tested              | Not tested              |
| Create conversation, send/receive messages             | Not tested              | Not tested              |
| Existing conversations and Projects accessible         | Not tested              | Not tested              |
| Switch tabs during a task; page/state preserved        | Not tested              | Not tested              |
| Back, Forward, Reload, external browser                | Not tested              | Not tested              |
| Resize window, close/reopen window                     | Not tested              | Not tested              |
| Conversation URL change detected in console            | Not tested              | Not tested              |
| Upload/analyze file and download a result              | Not tested              | Not tested              |
| Microphone/voice/audio; deny then retry permission     | Not tested              | Not tested              |
| Camera/clipboard where requested                       | Not tested              | Not tested              |
| Offline/error state and Reload recovery                | Not tested              | Not tested              |
| Image generation if entitled                           | Not tested              | N/A                     |
| Artifacts interaction                                  | N/A                     | Not tested              |
| Work task execution and result access                  | Not tested              | N/A                     |
| Cowork/other available agentic workflow                | N/A                     | Not tested              |

## Known limitations and next step

Google OAuth or other providers may reject embedded Chromium. Do not bypass those restrictions. Login in an external browser does not authenticate the embedded profile. Bot challenges, passkeys, DRM, downloads, microphone/camera access and popup redirects can behave differently from a regular browser. Unknown auth redirects intentionally fail closed. Permissions for third-party artifact frames are denied; test artifact interactions to establish the impact.

ChatGPT Work and Claude Cowork availability depends on the website, account entitlements and provider support. Features requiring an official desktop app, native integrations or desktop tools may be unavailable. This app cannot reproduce those capabilities. Restarting restores authentication but does not restore in-memory tabs or guarantee task continuation.

Next iteration: run the compatibility matrix on macOS with both accounts and document reproducible results before adding product features or investing in packaging. Keep a browser fallback for unsupported flows. Avoid API integrations, scraping and browser-security workarounds.

## Validation in this implementation

- `pnpm --filter airove typecheck`: passed.
- `pnpm --filter airove lint`: passed with zero warnings.
- `pnpm --filter airove test`: four tests passed (unsafe navigation, auth/provider origin boundaries, sensitive URL redaction, conversation detection).
- `pnpm --filter airove build`: passed for main, preload and renderer.
- Dependency resolution: existing pnpm 10.9.0 lockfile updated only with the Airove importer; frozen-lockfile filtered installation passed with lifecycle scripts skipped. Electron downloaded separately through the environment proxy. An initial install including root dependencies failed in unrelated `better-sqlite3` because its default node-gyp cache path was unavailable in this Linux sandbox.
- Runtime launch attempted on Linux: Electron aborted because the host Chromium SUID sandbox helper is not configured. Browser security was left enabled. This prevents runtime/provider compatibility claims from this environment.
- Build emits the repository's existing stale Browserslist-data notice. No shared dependency updates were made.
- Vite development HTML smoke check: passed; React refresh preamble is present and permitted by the development-only CSP. Production HTML retains `script-src 'self'` and `style-src 'self'`. Only the local development server permits inline scripts/styles for Vite refresh; remote provider views do not use this local page policy.
- Chromium renderer smoke test was also attempted and blocked by the same host SUID sandbox configuration.
- Turborepo dry run confirms `dev:airove` resolves to `airove#dev` / `electron-vite dev`.
