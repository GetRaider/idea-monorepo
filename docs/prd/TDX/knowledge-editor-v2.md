# Knowledge Editor V2 — Notion-style document authoring

## Product goal

> Scope clarification (user QA, Nov 20, 2026): this PR implements **simple rich-text document tables**, not Notion-style database tables. Property types, filtering and sorting require a separate database resource and view renderer. See [issue #55](https://github.com/GetRaider/idea-monorepo/issues/55). The screenshot exposed missing grid styling; explicit table CSS and contextual table controls were added in response.

Make Knowledge Docs comfortable for technical specifications, product briefs, research notes, and AI-readable documentation. Keep the existing Tiptap document JSON, Todex entity mentions, Space/Folder hierarchy, and API/MCP contract.

The Knowledge document editor is intentionally richer than Task/Epic/Goal descriptions. Task descriptions continue to use the existing HTML-based editor and sanitizer.

## This PR: rich document foundation

- Knowledge canvas: centered reading width, prominent title, document typography, and no redundant “Description” heading.
- Document-only Tiptap extensions: 3×3 tables (header row, resize, contextual add/remove row/column actions), collapsible toggles, custom callouts, image-by-URL, and existing divider support.
- Slash menu: the existing commands plus Table, Callout, Toggle, Divider, and Image from URL.
- Preserve cross-entity @mentions and their stable target IDs; no duplicate mention system.
- Better plain-text projection for AI search/MCP: preserve table rows/cell boundaries, expandable-content text, callouts, and image alt text.
- Validate image URL protocols on the API, bound maximum URL length, and keep asset binaries outside document JSON.
- Serialize debounced autosave requests so older network responses cannot overwrite newer document versions.
- Tests for structured-block projections and image validation.

## Interaction notes

1. Type `/` at the beginning of a block to open the existing insertion menu.
2. Choose **Simple table** to insert a 3×3 table; placing the caret in a table reveals row/column actions.
3. Choose **Callout** or **Toggle** for documentation blocks; both are stored directly in Tiptap JSON.
4. Choose **Image from URL** to insert a safe HTTP(S) image URL; upload-backed images are deferred until an attachment service exists.
5. Type `@` to insert existing Todex Task, Document, Epic, or Event mentions.

## Future slices (not in this PR)

- Block drag-and-drop handles and contextual '+' insertion UI.
- Image/file uploads with signed storage URLs, captions, and resizing.
- Document table of contents, code syntax highlighting, and multi-column layout.
- Todex-native linked Task/Goal previews, and eventually embedded database views.
- Revision/ETag-based cross-client conflict resolution, collaborative editing, and version history.

## Architecture and safety

- The UI keeps one Tiptap engine but selects a distinct extension configuration for Knowledge, leaving task-description HTML serialization unchanged.
- Docs persist `body.content` as ProseMirror/Tiptap JSON; the API recursively projects that to `plainText` for retrieval and chunk indexing.
- Table and toggle content is **real document text**, not an iframe or an opaque embed.
- Image nodes contain URLs, not base64 media; allow only HTTP(S) URLs.
- Autosaves are processed sequentially within a mounted editor. This prevents same-tab request races but is **not** multi-device conflict resolution or guaranteed unload flushing.

## Manual verification checklist

- [ ] Install dependencies with `pnpm install` and regenerate/verify lockfile with `pnpm install --lockfile-only`.
- [ ] Run `pnpm --filter todex-web build` and `pnpm --filter todex-api test`.
- [ ] Existing documents and mentions round-trip without losing any content.
- [ ] Create/modify/delete a table's rows/columns; reload and verify persistence.
- [ ] Insert callout, toggle, divider, and image; reload and verify persistence.
- [ ] Verify autosave order under slow or throttled network requests.
- [ ] Verify Planning Task descriptions still use their original formatting and sanitization.

This scope deliberately does not claim Notion database parity. Do not merge this PR as evidence that property-based sorting/filtering is implemented; that is tracked separately in issue #55.
