# Knowledge database tables — Issue #55

## Purpose

Todex Knowledge Docs support two distinct block types:

1. `/Simple table`: rich-text Tiptap TableKit table, stored directly in the document JSON.
2. `/Database table`: independently persistent typed database rendered as a Tiptap React node view.

Database rows are **not** stored inside ProseMirror JSON; the document contains only a `databaseView` reference to an independently managed database ID and table view ID.

## Implemented first slice

- New space/workspace-owned database with automatically-created **Name** (Title) property and saved Table view.
- Property types: Title, Text, Number, Select, Multi-select, Date and Checkbox.
- Property creation, rename, safe type change (only on empty columns), select option editing, and deletion (Title protected).
- Database rename, inline row creation/deletion and validated cell editing.
- Saved ascending/descending sorting and typed filters (contains/equal/not equal/empty/comparison).
- Dark compact grid, keyboard Enter to commit free-form cells, horizontally scrollable wide tables.
- Standalone REST CRUD API with Zod validation, WorkspaceGuard and workspace-scoped database lookup.
- PostgreSQL schema and SQL migration `0037_knowledge_database_tables.sql`.
- Linked database text (bounded to 5 references, 20 properties, 30 rows each) included in document Knowledge indexing; database changes enqueue reindexing for referencing documents.
- Typed behavior tests and view sorting/filtering tests.

## Entity model

- `knowledge_databases` (workspace, space, name)
- `knowledge_database_properties` (database, name, type, options, position)
- `knowledge_database_rows` (database, cells JSONB keyed by stable property ID, position)
- `knowledge_database_views` (database, kind, filters, sorts)

All nested records are cascaded by database deletion. Removing a database _block_ from a document intentionally **does not delete the database**. This avoids accidental data loss if users remove or rearrange an embed. An explicit database management/deletion UX and orphan cleanup must be added separately. Documents can be moved across Spaces within the same workspace without invalidating references.

Title is the required first column. Other property types are validated on writes and cannot be changed while populated, avoiding silent conversion/data corruption.

## Excluded from this first slice

- Rows as full document pages, multiple saved named views, Board/Calendar/Gallery view renderers.
- Relations and rollups, formulas, advanced compound filters, import/export.
- Real-time collaboration, row-level ownership, document embedding across different workspaces.
- Dragging/reordering/hiding properties; property order uses creation order.
- Uploads, avatars, and styled property-choice management beyond text options.
- Dedicated workspace database management list.

## Manual QA before merge

1. Run `pnpm install --lockfile-only`, `pnpm --filter todex-api db:migrate`, `pnpm --filter todex-web build` and relevant tests.
2. Create a Common Knowledge Doc. Type `/database` and choose **Database table**. Verify the view renders and the document persists the reference across reload.
3. Add a Text/Number/Select/Date/Checkbox/Multi-select property and several rows. Edit each type; reload and check saved values.
4. Rename database, rename property, configure select choices, change an empty property's type, confirm non-empty conversion is rejected.
5. Sort numbers 2, 10, empty both directions; empty stays last. Filter text, checkbox and dates. Reload and verify saved view state.
6. Delete a row and property, confirm other cells remain and stale sorts/filters are removed.
7. Verify a user from another workspace cannot get/edit the database using its ID.
8. Reopen a referenced Doc after moving its Space; verify the embed still resolves.
9. Test the prior Toggle and Checklist blocks and simple tables independently (in PR #54).
10. Confirm the agent index includes a bounded database preview after an embed exists and after row edits.

**Note:** This is an implementation draft. Handwritten migration files should be reconciled with Drizzle-generated snapshots before production merge.

### Local verification (2026-11-21)

- `pnpm install --frozen-lockfile` succeeds with the regenerated lockfile.
- `pnpm --filter todex-api db:migrate` applies `0037` and `0038` cleanly to a copy of the local dev database.
- `todex-web` tests: 119/119 pass. `todex-api` tests: 163/166 pass; the 3 failures (`mcp-tools.test.ts`, `task-tool-handler.test.ts`) are in files this branch does not touch and also fail on `main`.
- `todex-web` production build fails on 26 type errors, all in files this branch does not touch: React 19 code is checked against the `@types/react` 18 catalog version. This also affects `main` and should be fixed separately.
- API and web dev servers start.

### Browser QA (2026-11-22, local test users)

Run with the local test login (`TODEX_DEV_LOGIN`), as `dev@todex.test`, with `dev2@todex.test` for cross-workspace checks.

Fixed during QA: every property/row/view write returned 500 after committing, so the grid did not refresh. The reindex lookup passed the database id to `jsonb_build_object` as an untyped parameter (`could not determine data type of parameter`). It is now cast to `text` and covered by a unit test.

Passed:

- `/database` inserts a Database table; the embed persists across reload.
- Add Number and Checkbox properties; add rows; edit number, checkbox and record name; values persist across reload.
- Changing the type of a populated property is rejected (400).
- Sort by number ascending (2, 10, empty) and descending (10, 2, empty); empty stays last; saved sort survives reload.
- Number filter (`greater than 5`) applies and is saved.
- Deleting a property removes its values and the sort/filter that used it; other cells remain. Deleting a row works.
- Cross-workspace: as `dev2@todex.test`, every database, property, row, page and view endpoint returns 404; no session returns 401.
- Clicking a record opens Side Peek with properties and a rich page body; edits save. **Open full page** shows the same content, properties and edits, and survives reload.
- Stale page version returns 409; the open editor shows "Conflict — reload required" instead of overwriting.
- Checklist, toggle and a simple table nested in a toggle still insert and persist.

Not covered:

- Select, Multi-select and Date properties, and text/checkbox/date filters.
- Rows created before migration `0038` (the QA database was created after it).
- Moving the doc's Space, and the agent index preview (needs the Ollama embedding worker running).
- Delete confirmations use `window.confirm`, which the test browser dismisses; the delete paths were exercised through the API instead.

Issues seen:

- The toggle "Toggle heading" text is fixed in the editor pass below.
- The grid shifted down about 40px after the first cell edit in a new document. It did not reproduce in the editor pass below (the database was not the first block there).

### Knowledge Doc Editor pass (2026-11-22)

Every block in the slash menu, Markdown shortcuts, inline formatting, mentions and reload were checked in the browser.

Working as expected: paragraph, bulleted list (`- `), numbered list, checklist, blockquote, code block, callout, divider, simple table (Tab between cells, typing below it), database table, image rendering, bold (bubble menu), italic (Cmd+I), URL autolink, `@` mentions of docs, and full persistence across reload.

Fixed:

- **Title.** Enter inserted a newline into the title (it is a textarea), so whatever you typed next went into the title. Enter now moves into the body, newlines (including pasted ones) are collapsed, and the title grows with its text instead of scrolling inside two fixed rows.
- **"Untitled" was real text.** New docs showed "Untitled" as an editable value, so typing appended to it. It is now the placeholder; an empty title is saved as "Untitled". Body edits were also silently not saved while the title was empty; they are now.
- **`# ` did nothing.** The slash menu's Heading 1–3 are h2–h4 (the page title is the h1), but Markdown shortcuts used StarterKit's levels, so `# ` was ignored and `## ` made Heading 1. `#`, `##` and `###` now match Heading 1–3.
- **Toggle.** Inserted with a literal "Toggle heading" and the cursor in the body. It now starts empty with a "Toggle" placeholder and the cursor in the title. Enter in the title moves into the empty body (Tiptap inserted a stray paragraph, which broke double-Enter exit), and double Enter exits.
- **Toggle shown collapsed while open.** A Tiptap race (the node view toggles, rather than sets, its open class in a timeout) could render a new toggle collapsed, sending Enter past it. The rendered state is now re-synced with the `open` attribute.
- **Collapsing the first block did not persist.** Tiptap skips persisting when the toggle is at position 0. Collapse/expand of a first-block toggle is now saved.
- **Links and inline code were unstyled.** Autolinked URLs looked like plain text. Links are now underlined in the primary color, and inline code has a mono font and background.
- **Table toolbar covered the row above.** It is now anchored above the table.

Not covered or limited:

- "Image from URL" asks for the address with `window.prompt`, which the test browser dismisses; image rendering was checked by inserting an image node directly. A proper URL input is a follow-up.
- Inline code via backticks and Cmd+E could not be typed in the test browser (the key is intercepted); the `code` mark exists and is now styled.
- The bubble menu has bold, italic, strike and lists only: no link or inline-code buttons.
- Mentions render as "@Doc <title>"; Notion shows the title only.

## Knowledge Editor V3: database pages (same PR)

Goal: Notion-like docs inside Knowledge folders that both humans and the AI agent can read and write, so their content can feed Planning and Execution.

### Removed from scope

The custom hover handles, drag-and-drop reordering, side-drop columns, `/Two columns`, `columns`/`column` nodes and block background colors were removed. They were the least stable part of the editor and add nothing an agent can use. If vertical block reordering is needed later, use Tiptap's DragHandle extension instead of a hand-rolled overlay.

### Database records are pages

- Database row storage now includes `content` (Tiptap JSON), optional `icon`/`cover`, and an integer `version`.
- New migration `0038_knowledge_database_pages.sql` backfills existing rows with an empty page body without losing any cells.
- Clicking a record name opens it in **Side Peek**; a separate **Rename** control keeps inline table editing available.
- **Open full page** navigates to `/knowledge/database/:databaseId/row/:rowId`.
- Side Peek and Full Page reuse the same rich Knowledge editor for page bodies and show database properties at the top.
- Page body saves are debounced and serialized, with optimistic version checking on the API to avoid silently overwriting another client’s edits; a conflict is surfaced to the user.
- Knowledge indexing includes a bounded excerpt of each database page body as well as its row properties.

### New browser acceptance checklist

- [ ] Open a database record by clicking its Name; edit its properties and rich page body in Side Peek.
- [ ] Expand the same record into Full Page and confirm content, icon, cover, and properties are shared across both modes.
- [ ] Reload record pages, including rows created before migration 0038, and verify content persists.
- [ ] Test two tabs editing the same page: stale page revisions should receive a conflict instead of overwriting.
- [ ] Confirm workspace authorization and previous Knowledge Docs, toggle, checklist, and simple tables still work.

### Limitations

This is a **functional Notion-style foundation**, not full Notion parity. Block drag-and-drop, columns, row-as-page nesting in the sidebar, collaborative cursors, custom database views, inline row comments, formulas, rollups, and complete property relations remain outside scope. Side Peek closing while the network fails still requires user attention to unsaved status. The PR must remain draft until migration and browser QA pass.
