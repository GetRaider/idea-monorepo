"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, cn } from "@repo/ui";
import { DocType } from "@repo/api/todex";

import { PlusIcon } from "@components/icons";

import { useDocs } from "./docs-provider";

export function DocsCanvasHeader({
  crumbs,
  folderId = null,
  showSearch = true,
  showNew = true,
  trailing,
}: {
  crumbs: DocsCrumb[];
  folderId?: string | null;
  showSearch?: boolean;
  showNew?: boolean;
  trailing?: ReactNode;
}) {
  const {
    state: { search },
    actions: { setSearch, createDoc },
  } = useDocs();

  return (
    <div className="mb-6 flex flex-col gap-4">
      <DocsBreadcrumb className="w-full flex-none" crumbs={crumbs} />
      <div className="flex items-center justify-end gap-2">
        {showSearch ? (
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            aria-label="Search"
            className="h-9 w-40 min-w-0 rounded-md border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        ) : null}
        {showNew ? (
          <Button
            size="sm"
            onClick={() => void createDoc(DocType.COMMON, folderId)}
          >
            <PlusIcon size={16} />
            New
          </Button>
        ) : null}
        {trailing}
      </div>
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
