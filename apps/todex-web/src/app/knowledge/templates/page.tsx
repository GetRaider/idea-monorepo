"use client";

import { docsSectionClassName } from "../doc-collection";
import { DocsCanvasHeader } from "../docs-header";

export default function TemplatesPage() {
  return (
    <section className={docsSectionClassName()}>
      <DocsCanvasHeader
        crumbs={[{ label: "Knowledge", href: "/knowledge" }, { label: "Templates" }]}
        showNew={false}
        showSearch={false}
      />
      <p className="text-sm text-muted-foreground">
        Document templates are not available yet.
      </p>
    </section>
  );
}
