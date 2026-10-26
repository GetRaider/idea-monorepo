"use client";

import { DocType } from "@repo/api/todex";

import { DocListPage } from "../doc-list-page";

export default function GeneralDocsPage() {
  return (
    <DocListPage
      crumbs={[{ label: "Knowledge", href: "/knowledge" }, { label: "General" }]}
      emptyLabel="No docs yet."
      match={(doc) => doc.type === DocType.COMMON}
    />
  );
}
