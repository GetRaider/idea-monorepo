"use client";

import { DocType } from "@repo/api/todex";

import { DocListPage } from "../doc-list-page";

export default function GoalsDocsPage() {
  return (
    <DocListPage
      crumbs={[{ label: "Docs", href: "/docs" }, { label: "Goals" }]}
      emptyLabel="No goals yet."
      match={(doc) => doc.type === DocType.GOAL}
    />
  );
}
