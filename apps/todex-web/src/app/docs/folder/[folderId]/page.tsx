"use client";

import { use } from "react";

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
        { label: "Docs", href: "/docs" },
        { label: folder?.name ?? "Folder" },
      ]}
      folderId={folderId}
      emptyLabel="Nothing in this folder."
      match={(doc) => doc.folderId === folderId}
    />
  );
}
