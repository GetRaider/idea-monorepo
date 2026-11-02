"use client";

import { use } from "react";
import { DocType } from "@repo/api/todex";

import { DocListPage } from "../../../../doc-list-page";
import { useDocs } from "../../../../docs-provider";

export default function KnowledgeSpaceFolderPage({
  params,
}: {
  params: Promise<{ spaceId: string; folderId: string }>;
}) {
  const { spaceId, folderId } = use(params);
  const {
    state: { spaces, folders },
  } = useDocs();
  const space = spaces.find((item) => item.id === spaceId);
  const folder = folders.find((item) => item.id === folderId);

  return (
    <DocListPage
      crumbs={[
        { label: "Knowledge", href: "/knowledge" },
        { label: space?.name ?? "Space", href: `/knowledge/space/${spaceId}` },
        { label: folder?.name ?? "Folder" },
      ]}
      spaceId={spaceId}
      folderId={folderId}
      emptyLabel="Nothing in this folder."
      match={(doc) =>
        doc.spaceId === spaceId &&
        doc.folderId === folderId &&
        doc.type === DocType.COMMON
      }
    />
  );
}
