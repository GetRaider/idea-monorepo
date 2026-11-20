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
