"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
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
    <div className="mb-6 flex items-start justify-between gap-4">
      <DocsBreadcrumb crumbs={crumbs} />
      <div className="flex min-w-0 items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <PlusIcon size={16} />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => void createDoc(DocType.COMMON, folderId)}
              >
                New doc
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => void createDoc(DocType.GOAL, folderId)}
              >
                New goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}

export function DocsBreadcrumb({ crumbs }: { crumbs: DocsCrumb[] }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 text-2xl font-semibold tracking-tight">
      {crumbs.map((crumb, index) => (
        <span
          key={`${crumb.label}-${index}`}
          className="flex min-w-0 items-center gap-3"
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
