"use client";

import Link from "next/link";
import { DocType, type DocFolder, type Space } from "@repo/api/todex";
import { Spinner } from "@repo/ui";

import { DocRows, docsSectionClassName, filterDocs } from "./doc-collection";
import { DocsCanvasHeader } from "./docs-header";
import { useDocs } from "./docs-provider";

export default function DocsPage() {
  const {
    state: { docs, folders, spaces, search, isLoading },
  } = useDocs();
  const visibleDocs = filterDocs(
    docs.filter((doc) => doc.type === DocType.COMMON),
    search,
  );
  const recentDocs = visibleDocs.slice(0, RECENT_LIMIT);
  const visibleFolders = filterFolders(folders, spaces, search);

  return (
    <section className={docsSectionClassName()}>
      <DocsCanvasHeader crumbs={[{ label: "Knowledge" }]} />
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : (
        <>
          {folders.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                Folders
              </h2>
              <DocFolderRows folders={visibleFolders} spaces={spaces} />
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Recently Updated
            </h2>
            <DocRows
              docs={recentDocs}
              emptyLabel={
                search.trim() ? "Nothing matches this search." : "No docs yet."
              }
            />
          </section>
        </>
      )}
    </section>
  );
}

function DocFolderRows({ folders, spaces }: DocFolderRowsProps) {
  const spaceNameById = new Map(spaces.map((space) => [space.id, space.name]));

  if (folders.length === 0) {
    return (
      <p className="px-2 py-2 text-sm text-muted-foreground">
        Nothing matches this search.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {folders.map((folder) => (
        <li key={folder.id}>
          <Link
            href={`/knowledge/space/${folder.spaceId}/folder/${folder.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface"
          >
            <span className="min-w-0 flex-1 truncate">{folder.name}</span>
            <span className="max-w-40 truncate text-xs text-muted-foreground">
              {spaceNameById.get(folder.spaceId) ?? "Space"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function filterFolders(
  folders: DocFolder[],
  spaces: Space[],
  search: string,
) {
  const spaceNameById = new Map(spaces.map((space) => [space.id, space.name]));
  const query = search.trim().toLowerCase();
  const matched = query
    ? folders.filter((folder) => {
        const spaceName = spaceNameById.get(folder.spaceId) ?? "";
        return (
          folder.name.toLowerCase().includes(query) ||
          spaceName.toLowerCase().includes(query)
        );
      })
    : folders;
  return [...matched].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

const RECENT_LIMIT = 8;

interface DocFolderRowsProps {
  folders: DocFolder[];
  spaces: Space[];
}
