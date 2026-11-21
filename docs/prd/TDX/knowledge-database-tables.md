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

All nested records are cascaded by database deletion. Removing a database *block* from a document intentionally **does not delete the database**. This avoids accidental data loss if users remove or rearrange an embed. An explicit database management/deletion UX and orphan cleanup must be added separately. Documents can be moved across Spaces within the same workspace without invalidating references.

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

**Note:** This is an implementation draft. The integration in this environment cannot run the full application, and handwritten migration files should be reconciled with Drizzle-generated snapshots before production merge.


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
