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
2. Click **New Chat** to open Airove's draft screen. Select **ChatGPT** or **Claude** and a **Space** (or **No Space · All Chats**). The form defaults to the current context and remembers each Space's provider preference.
3. Type a draft, or click **Dictate**, speak, and **Stop recording**. Review/edit the recognized text. Click **Continue in ChatGPT/Claude** to open the provider's native new-chat page and fill its draft field.
4. Review the draft in the provider and press its **Send** button yourself. Airove never sends it. When a unique conversation URL appears, Airove captures its metadata. The chat is associated with the Space chosen in the draft form when Continue was clicked, even if another Space is selected before capture.
5. Open saved chats from the Sidebar. Switching Spaces or providers preserves both existing native views and their browser sessions.
6. Use the **···** buttons to rename, move or remove library entries. **Save name** and **Move** are separate actions. Local chat renames are kept when the provider later changes its page title.

**All Chats** includes every saved chat. A Folder holds only Spaces. Deleting a Folder moves its Spaces to the root. Deleting a Space keeps its chats, unassigned, in All Chats. Removing a local chat never deletes the provider conversation.

Each Space remembers a manually selected provider (or the provider used for New Chat/opening a saved chat). A Space without a preference uses the application's last provider. Sidebar selection is temporary; preferences and metadata persist.

## Architecture and storage

Continues Tempo's electron-vite main/preload/renderer/shared structure, React, Tailwind 3, and shared TypeScript/ESLint configs. The compact local UI avoids pulling in unrelated shared UI dependencies. No other application or shared package is changed.

The main process owns two persistent sandboxed `WebContentsView` instances, with `persist:chatgpt` and `persist:claude` sessions. The selected view is attached to the right of a 340px Sidebar and below a 104px toolbar. Selecting a Space can restore its preferred provider, but does not navigate either view. The draft screen temporarily detaches the native view so the React form is visible; Cancel restores the same view. Only continuing New Chat, Open Chat, or the navigation toolbar changes a provider's page.

Metadata uses **SQLite via `sql.js`**, matching Tempo's existing dependency and avoiding a new native SQLite binding. The database lives at `app.getPath('userData')/airove.sqlite`; on macOS this is normally `~/Library/Application Support/airove/airove.sqlite`. Existing browser profiles stay in the same Airove directory and are not migrated or reset.

Tables store Folders, Spaces, Chats and the last provider. Chat uniqueness is enforced by `(provider, canonical URL)`. A private title-source flag preserves local title edits. All database access stays in Main. Writes export the small metadata database to a private temporary file and atomically rename it; a failed write restores the in-memory snapshot. A single-instance lock prevents competing processes from overwriting it. Serialization is intentionally simple and suitable for a small personal library, not large-scale storage. Metadata is not encrypted by this app.

## Capture rules

- ChatGPT: `/c/<id>` and `/g/<project-or-GPT>/c/<id>`, canonicalized to `https://chatgpt.com/c/<id>`.
- Claude: `/chat/<id>`, canonicalized to `https://claude.ai/chat/<id>`.
- Queries, fragments and trailing slashes are removed. Provider origins, URL schemes and complete paths are validated. Login, home, settings, shared links and unrelated pages are not saved.
- Conversation capture uses only main-frame navigation and native page-title events. It does not inspect or scrape conversation messages. The separate, user-initiated draft handoff focuses only the provider composer as described below.
- Continuing New Chat creates a one-shot intent per provider. Capture waits for the native new-chat landing page, then the first conversation navigation. Its initiating Space is used only for a new record. Existing records retain their current association.
- Ordinary navigation to an unknown existing conversation saves it without a Space. New Chat in All Chats also saves without a Space. A Space deleted while capture is pending becomes an unassigned association.
- Native page-title events update meaningful automatic titles, including when the title arrives before the URL event. Generic/loading titles are ignored. Local titles are not overwritten.
- Removing a currently open local record suppresses immediate recapture from title updates or Reload. Navigating away and revisiting it may capture it again. No provider conversation is removed.
- Chats are ordered by their latest opening or metadata update.

Navigation events cannot reliably distinguish a brand-new conversation from an unknown existing conversation selected inside the provider immediately after New Chat. The first unseen conversation after that explicit intent receives its Space context. Use the library's Move action if you instead opened an old conversation. This is the limit of URL/title-only capture without inspecting provider content.

## Draft handoff and local dictation

The draft form accepts text and microphone dictation only. Text is limited to 32,000 characters. Continuing uses an explicitly validated provider, Space and text payload, preserving that Space as the pending capture context. No conversation record is created until you send the draft in the provider and a conversation URL exists.

Handoff uses a small static script to verify the exact provider/new-chat page, locate a visible native composer, check that it is empty and focus it. The prompt itself is passed to Electron's native `webContents.insertText`, never interpolated into JavaScript or placed in a URL. No Send button is clicked and no Enter key is simulated. An occupied composer is left unchanged. These selectors depend on provider UI structure and require live compatibility testing when providers change their sites.

If you need to sign in, the draft waits in memory. Airove retries when the composer becomes available (up to 20 attempts). The toolbar offers **Retry**, explicit **Copy draft**, and **Dismiss** if the composer is unavailable or occupied. A redirect to an existing conversation retains an uninserted draft for copying. Inserted/dismissed text is released from Main; closing the app discards pending drafts. Draft text and audio are never added to the metadata database or logs. Provider-controlled browser behavior may retain its own unsent drafts.

Dictation follows Tempo's Transformers.js approach, using multilingual `onnx-community/whisper-tiny` with q8 weights and the repository's existing ONNX Runtime version. Audio is recorded for at most two minutes, decoded/resampled to 16 kHz, and transcribed on-device in a worker. The first use downloads the model from Hugging Face; browser caching retains model assets where available. No audio is uploaded to a transcription service and no model API key is required. Microphone permission is requested only on Dictate. Cancel, errors and closing the form stop the microphone and terminate the worker. You can always type instead.

The built renderer uses a secure local `airove://app/` origin for worker assets and model caching. The protocol serves only files in the renderer build directory. The local CSP permits its packaged worker/WASM code and Hugging Face model download hosts. Provider pages retain their existing isolation and browser security.

## Security and compatibility

Remote views and authentication popups retain sandboxing, context isolation, normal certificate validation and no Node integration or app preload. The local preload adds only explicit Space/library/New Chat/Open Chat operations. Main validates the exact local renderer sender, main frame and all operation inputs. Rendered names/titles use React text escaping; SQL uses bound parameters.

Known official authentication destinations can navigate within each isolated provider session. Other HTTPS links require confirmation before opening in the system browser; unlisted redirects fail closed. External browser sessions are independent from Airove. Google OAuth, passkeys or provider bot checks may reject embedded browsers; no restriction bypass is implemented.

Site permissions are denied by default. Only an owned top-level official provider origin may request media, clipboard or fullscreen permission, with user approval for the window session. macOS microphone/camera approval is separate. Native file inputs and Electron's normal download behavior remain available. Production microphone/camera packaging, signing and entitlements remain out of scope.

Logs retain redacted provider URLs and numeric navigation errors, never titles, conversation IDs, cookies, tokens or OAuth parameters. The database deliberately stores conversation URLs and titles, but never messages, attachments or credentials. The browser profiles still retain provider-managed cookies, cache and site data independently of this metadata database.

HTTP 4xx/5xx responses and network failures are shown without deleting saved records. A provider that displays an unavailable-conversation screen with HTTP 200 cannot be reliably detected without inspecting its page; its own error remains visible in the native view. Agentic features, Work, Cowork, Artifacts, voice and account entitlements remain provider-dependent and require actual macOS testing.

## Automated validation

- Typecheck, lint with zero warnings, and main/preload/renderer build: passed.
- **43 tests passed**: URL recognition/canonicalization, origin boundaries and redaction; IPC payload validation; metadata deduplication, recency and disk persistence; container/chat CRUD; failed-write rollback; provider preferences; per-provider New Chat context; title ordering; removed-entry suppression; React library/action flows; draft payload validation, one-time insertion and occupied/sign-in fallbacks; composer-only targeting; dictation permissions, transcription handoff and cancellation cleanup; and secure local asset paths.
- Dependencies installed using pnpm 10.9.0; filtered frozen-lockfile install passed. Lifecycle scripts were skipped in this Linux environment, and its existing Electron runtime was reused. The lockfile changes are limited to Airove's dependencies. Dictation adds the same Transformers.js/ONNX Runtime versions already present for Tempo.
- Provider authentication, live native composer insertion, real microphone/model inference, navigation/capture timing and macOS browser-session persistence are **not validated** by these tests. React UI tests run in jsdom; they do not exercise actual native browser views.
- Native Electron launch was attempted on Linux and blocked by the host's Chromium SUID sandbox configuration. Browser security was left enabled. The build also reports the repository's stale Browserslist-data notice.

## Manual acceptance checklist

Run on macOS with the existing provider accounts. Record provider, OS/Electron version, account entitlement, observed result and limitations without copying credentials or private conversations.

- [ ] Existing ChatGPT and Claude login sessions survive the update and a full app restart.
- [ ] Create, rename and delete a Folder; its Spaces move to the root.
- [ ] Create, rename and move Spaces between Folders and root; no nested Folders exist.
- [ ] Choose a different provider per Space; selections persist after restart.
- [ ] Open New Chat; choose AI and Space, enter text, then Continue. The native composer contains the text and waits for you to press Send.
- [ ] Dictate a short message, stop, review/edit its transcript and continue. Confirm macOS microphone approval and first-use model download.
- [ ] Cancel dictation and close the draft form; the microphone stops and existing native pages remain intact.
- [ ] Handoff while signed out: sign in, then confirm insertion or use Retry/Copy draft. Existing native draft text is never overwritten.
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

Complete the macOS acceptance matrix before expanding scope or packaging. No ongoing chat renderer, routing, model APIs, custom agents, conversation scraping, message synchronization or cloud storage is included.
