"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@repo/ui";
import { DocType } from "@repo/api/todex";

import { NewButton } from "@components/new-button";

import { useDocs } from "./docs-provider";

export function DocsCanvasHeader({
  crumbs,
  folderId = null,
  showNew = true,
  trailing,
}: {
  crumbs: DocsCrumb[];
  folderId?: string | null;
  showNew?: boolean;
  trailing?: ReactNode;
}) {
  const {
    actions: { createDoc },
  } = useDocs();

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <DocsBreadcrumb className="min-w-0" crumbs={crumbs} />
      {showNew || trailing ? (
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          {showNew ? (
            <NewButton onClick={() => void createDoc(DocType.COMMON, folderId)} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function DocsBreadcrumb({
  crumbs,
  className,
}: {
  crumbs: DocsCrumb[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight",
        className,
      )}
    >
      {crumbs.map((crumb, index) => (
        <span
          key={`${crumb.label}-${index}`}
          className="flex shrink-0 items-center gap-3"
        >
          {index > 0 ? (
            <span className="shrink-0 text-muted-foreground">›</span>
          ) : null}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="shrink-0">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export interface DocsCrumb {
  label: string;
  href?: string;
}
