# Airove v0.2 — Spaces and native chat management

A personal desktop organizer around the official ChatGPT and Claude websites. Organize conversation links into Spaces and optional Folders, create native conversations, capture their metadata, and continue them later. All AI interactions use the provider's own interface and account session.

The existing Native AI Hub POC is named **Airove**, so its directory remains `apps/airove` and its entrypoint remains `pnpm dev:airove`.

## Run locally on macOS

Use Node 20.18+ and the repository's pnpm 10.9.0:

```sh
pnpm install
pnpm dev:airove
```

Checks:

```sh
pnpm --filter airove typecheck
pnpm --filter airove lint
pnpm --filter airove test
pnpm --filter airove build
```

Production packaging is not included. No backend, Docker, database server or model API key is required.

## Using the organizer

1. Create a Folder or Space with the Sidebar's **+ Folder** / **+ Space** buttons. Spaces can stay at the root or be moved into a Folder.
2. Select a Space, or **All Chats** for an unassigned conversation.
3. Choose **ChatGPT** or **Claude**, then click **New Chat**. Sign in through the provider if necessary and work in its original interface.
4. When a unique conversation URL appears, Airove captures its metadata. The chat is associated with the Space selected when New Chat was clicked, even if another Space is selected before capture.
5. Open saved chats from the Sidebar. Switching Spaces or providers preserves both existing native views and their browser sessions.
6. Use the **···** buttons to rename, move or remove library entries. **Save name** and **Move** are separate actions. Local chat renames are kept when the provider later changes its page title.

**All Chats** includes every saved chat. A Folder holds only Spaces. Deleting a Folder moves its Spaces to the root. Deleting a Space keeps its chats, unassigned, in All Chats. Removing a local chat never deletes the provider conversation.

Each Space remembers a manually selected provider (or the provider used for New Chat/opening a saved chat). A Space without a preference uses the application's last provider. Sidebar selection is temporary; preferences and metadata persist.

## Architecture and storage

Continues Tempo's electron-vite main/preload/renderer/shared structure, React, Tailwind 3, and shared TypeScript/ESLint configs. The compact local UI avoids pulling in unrelated shared UI dependencies. No other application or shared package is changed.

The main process owns two persistent sandboxed `WebContentsView` instances, with `persist:chatgpt` and `persist:claude` sessions. The selected view is attached to the right of a 340px Sidebar and below a 104px toolbar. Selecting a Space can restore its preferred provider, but does not navigate either view. Only New Chat, Open Chat, or the navigation toolbar changes a provider's page.

Metadata uses **SQLite via `sql.js`**, matching Tempo's existing dependency and avoiding a new native SQLite binding. The database lives at `app.getPath('userData')/airove.sqlite`; on macOS this is normally `~/Library/Application Support/airove/airove.sqlite`. Existing browser profiles stay in the same Airove directory and are not migrated or reset.

Tables store Folders, Spaces, Chats and the last provider. Chat uniqueness is enforced by `(provider, canonical URL)`. A private title-source flag preserves local title edits. All database access stays in Main. Writes export the small metadata database to a private temporary file and atomically rename it; a failed write restores the in-memory snapshot. A single-instance lock prevents competing processes from overwriting it. Serialization is intentionally simple and suitable for a small personal library, not large-scale storage. Metadata is not encrypted by this app.

## Capture rules

- ChatGPT: `/c/<id>` and `/g/<project-or-GPT>/c/<id>`, canonicalized to `https://chatgpt.com/c/<id>`.
- Claude: `/chat/<id>`, canonicalized to `https://claude.ai/chat/<id>`.
- Queries, fragments and trailing slashes are removed. Provider origins, URL schemes and complete paths are validated. Login, home, settings, shared links and unrelated pages are not saved.
- Only main-frame navigation and native page-title events are used. No injected JavaScript, message inspection or DOM scraping.
- New Chat creates a one-shot intent per provider. Capture waits for the native new-chat landing page, then the first conversation navigation. Its initiating Space is used only for a new record. Existing records retain their current association.
- Ordinary navigation to an unknown existing conversation saves it without a Space. New Chat in All Chats also saves without a Space. A Space deleted while capture is pending becomes an unassigned association.
- Native page-title events update meaningful automatic titles, including when the title arrives before the URL event. Generic/loading titles are ignored. Local titles are not overwritten.
- Removing a currently open local record suppresses immediate recapture from title updates or Reload. Navigating away and revisiting it may capture it again. No provider conversation is removed.
- Chats are ordered by their latest opening or metadata update.

Navigation events cannot reliably distinguish a brand-new conversation from an unknown existing conversation selected inside the provider immediately after New Chat. The first unseen conversation after that explicit intent receives its Space context. Use the library's Move action if you instead opened an old conversation. This is the limit of URL/title-only capture without inspecting provider content.

## Security and compatibility

Remote views and authentication popups retain sandboxing, context isolation, normal certificate validation and no Node integration or app preload. The local preload adds only explicit Space/library/New Chat/Open Chat operations. Main validates the exact local renderer sender, main frame and all operation inputs. Rendered names/titles use React text escaping; SQL uses bound parameters.

Known official authentication destinations can navigate within each isolated provider session. Other HTTPS links require confirmation before opening in the system browser; unlisted redirects fail closed. External browser sessions are independent from Airove. Google OAuth, passkeys or provider bot checks may reject embedded browsers; no restriction bypass is implemented.

Site permissions are denied by default. Only an owned top-level official provider origin may request media, clipboard or fullscreen permission, with user approval for the window session. macOS microphone/camera approval is separate. Native file inputs and Electron's normal download behavior remain available. Production microphone/camera packaging, signing and entitlements remain out of scope.

Logs retain redacted provider URLs and numeric navigation errors, never titles, conversation IDs, cookies, tokens or OAuth parameters. The database deliberately stores conversation URLs and titles, but never messages, attachments or credentials. The browser profiles still retain provider-managed cookies, cache and site data independently of this metadata database.

HTTP 4xx/5xx responses and network failures are shown without deleting saved records. A provider that displays an unavailable-conversation screen with HTTP 200 cannot be reliably detected without inspecting its page; its own error remains visible in the native view. Agentic features, Work, Cowork, Artifacts, voice and account entitlements remain provider-dependent and require actual macOS testing.

## Automated validation

- Typecheck, lint with zero warnings, and main/preload/renderer build: passed.
- **26 tests passed**: URL recognition/canonicalization, origin boundaries and redaction; IPC payload validation; metadata deduplication, recency and disk persistence; container/chat CRUD; failed-write rollback; provider preferences; per-provider New Chat context; title ordering; removed-entry suppression; and React library/action flows.
- Dependencies installed using pnpm 10.9.0; filtered frozen-lockfile install passed. Lifecycle scripts were skipped in this Linux environment, and its existing Electron runtime was reused. The only lockfile change is Airove's added dependencies (`sql.js`, its types, and `jsdom` for UI tests).
- Provider authentication, real navigation/capture timing and macOS browser-session persistence are **not validated** by these tests. React UI tests run in jsdom; they do not exercise actual native browser views.
- Native Electron launch was attempted on Linux and blocked by the host's Chromium SUID sandbox configuration. Browser security was left enabled. The build also reports the repository's stale Browserslist-data notice.

## Manual acceptance checklist

Run on macOS with the existing provider accounts. Record provider, OS/Electron version, account entitlement, observed result and limitations without copying credentials or private conversations.

- [ ] Existing ChatGPT and Claude login sessions survive the update and a full app restart.
- [ ] Create, rename and delete a Folder; its Spaces move to the root.
- [ ] Create, rename and move Spaces between Folders and root; no nested Folders exist.
- [ ] Choose a different provider per Space; selections persist after restart.
- [ ] Select Space A → provider → New Chat → send a message; the resulting chat is saved to A.
- [ ] After opening the new-chat page in A, switch Sidebar to Space B before sending; capture still associates with A.
- [ ] Start New Chat in All Chats; capture remains unassigned.
- [ ] Navigate normally to an unknown old conversation in the provider; it is saved without a Space.
- [ ] Reopen a known conversation while another Space is selected; no duplicate or reassignment occurs.
- [ ] ChatGPT project conversation URLs reopen correctly after canonicalization.
- [ ] Provider-generated titles update; a local rename survives later provider title changes.
- [ ] Open, rename, move, unassign and remove chats; local removal keeps the original provider conversation.
- [ ] Delete a Space; its chats remain in All Chats.
- [ ] Restart; all containers, metadata and provider preferences remain.
- [ ] Switch Spaces/providers and resize the window; native views retain state and fit alongside the Sidebar.
- [ ] Back, Forward, Reload and external-browser actions still work.
- [ ] Missing or inaccessible conversations retain local records; network/HTTP failures are visible.
- [ ] File uploads/downloads, voice and approved permissions still work where supported.
- [ ] Test available ChatGPT Work and Claude Artifacts/Cowork workflows; document unavailable desktop-only features.
- [ ] Logs and metadata contain no message bodies, credentials or OAuth parameters.

Complete the macOS acceptance matrix before expanding scope or packaging. No routing, universal composer, APIs, custom agents, scraping, message synchronization or cloud storage is included.
