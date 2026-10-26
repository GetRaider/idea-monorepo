"use client";

import { use } from "react";
import { DocType } from "@repo/api/todex";

import { DocListPage } from "../../doc-list-page";
import { useDocs } from "../../docs-provider";

export default function FolderDocsPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const {
    state: { folders },
  } = useDocs();
  const folder = folders.find((item) => item.id === folderId);

  return (
    <DocListPage
      crumbs={[
        { label: "Knowledge", href: "/knowledge" },
        { label: folder?.name ?? "Folder" },
      ]}
      folderId={folderId}
      emptyLabel="Nothing in this folder."
      match={(doc) =>
        doc.folderId === folderId && doc.type === DocType.COMMON
      }
    />
  );
}
