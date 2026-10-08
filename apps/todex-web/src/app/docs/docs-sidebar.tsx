"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@repo/ui";

import {
  DocsIcon,
  FolderIcon,
  PlusIcon,
  StatusDoneIcon,
} from "@components/icons";
import { useModuleSidebar } from "@components/module-sidebar";
import { ResizeHandle } from "@components/resize-handle";
import {
  clampPanelWidth,
  parseStoredPanelWidth,
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
} from "@/helpers/panel-layout";

import { useDocs } from "./docs-provider";

const WIDTH_STORAGE_KEY = "todex:docs-sidebar-width";

export function DocsModuleSidebar() {
  const pathname = usePathname() ?? "";
  const {
    state: { folders },
    actions: { createFolder },
  } = useDocs();
  const { open: isOpen } = useModuleSidebar();
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);
  const [folderDraft, setFolderDraft] = useState<string | null>(null);

  useEffect(() => {
    setWidth(readWidth());
  }, []);

  if (!isOpen) return null;

  return (
    <aside className="relative flex h-full shrink-0 flex-col" style={{ width }}>
      <ResizeHandle
        label="Resize sidebar"
        edge="trailing"
        width={width}
        min={TASKS_SIDEBAR_MIN_WIDTH}
        max={TASKS_SIDEBAR_MAX_WIDTH}
        onWidth={setWidth}
        onCommit={writeWidth}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-3 pb-3 pt-3">
        <section className="mb-4 w-full">
          <h2 className="mb-2 px-2 text-sm text-muted-foreground">Views</h2>
          <SidebarLink
            href="/docs"
            label="All"
            active={pathname === "/docs"}
            icon={<DocsIcon size={16} />}
          />
          <SidebarLink
            href="/docs/goals"
            label="Goals"
            active={pathname === "/docs/goals"}
            icon={<StatusDoneIcon size={16} />}
          />
          <SidebarLink
            href="/docs/general"
            label="General"
            active={pathname === "/docs/general"}
            icon={<DocsIcon size={16} />}
          />
        </section>
        <section className="flex min-h-0 w-full flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-sm text-muted-foreground">Folders</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="New folder"
                  onClick={() => setFolderDraft("")}
                >
                  <PlusIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New folder</TooltipContent>
            </Tooltip>
          </div>
          {folderDraft !== null ? (
            <form
              className="mb-2 px-2"
              onSubmit={(event) => {
                event.preventDefault();
                const name = folderDraft.trim();
                if (!name) return;
                void createFolder(name);
                setFolderDraft(null);
              }}
            >
              <input
                autoFocus
                aria-label="Folder name"
                value={folderDraft}
                placeholder="Folder name"
                className="h-8 w-full rounded-md border border-border bg-transparent px-2 text-sm outline-none"
                onChange={(event) => setFolderDraft(event.target.value)}
                onBlur={() => {
                  if (!folderDraft.trim()) setFolderDraft(null);
                }}
              />
            </form>
          ) : null}
          {folders.map((folder) => (
            <SidebarLink
              key={folder.id}
              href={`/docs/folder/${folder.id}`}
              label={folder.name}
              active={pathname === `/docs/folder/${folder.id}`}
              icon={<FolderIcon size={16} />}
            />
          ))}
        </section>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "my-1 flex min-w-0 items-center gap-3 rounded-lg px-3 py-1.5 text-sm",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function readWidth() {
  try {
    return parseStoredPanelWidth(
      localStorage.getItem(WIDTH_STORAGE_KEY),
      TASKS_SIDEBAR_DEFAULT_WIDTH,
      TASKS_SIDEBAR_MIN_WIDTH,
      TASKS_SIDEBAR_MAX_WIDTH,
    );
  } catch {
    return TASKS_SIDEBAR_DEFAULT_WIDTH;
  }
}

function writeWidth(width: number) {
  try {
    localStorage.setItem(
      WIDTH_STORAGE_KEY,
      String(
        clampPanelWidth(width, TASKS_SIDEBAR_MIN_WIDTH, TASKS_SIDEBAR_MAX_WIDTH),
      ),
    );
  } catch {
    /* private mode / quota */
  }
}
