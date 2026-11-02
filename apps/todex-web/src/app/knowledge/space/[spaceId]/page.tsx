"use client";

import { use } from "react";
import { DocType } from "@repo/api/todex";

import { DocListPage } from "../../doc-list-page";
import { useDocs } from "../../docs-provider";

export default function KnowledgeSpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const {
    state: { spaces },
  } = useDocs();
  const space = spaces.find((item) => item.id === spaceId);

  return (
    <DocListPage
      crumbs={[
        { label: "Knowledge", href: "/knowledge" },
        { label: space?.name ?? "Space" },
      ]}
      spaceId={spaceId}
      emptyLabel="No docs yet."
      match={(doc) => doc.spaceId === spaceId && doc.type === DocType.COMMON}
    />
  );
}
