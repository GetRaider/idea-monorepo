"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@repo/ui";

import {
  ChevronIcon,
  DocsIcon,
  FolderIcon,
  PlusIcon,
  StatusDoneIcon,
} from "@components/icons";
import { ResizeHandle } from "@components/resize-handle";
import {
  clampPanelWidth,
  parseStoredPanelWidth,
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
} from "@/helpers/panel-layout";

import { useDocs } from "./docs-provider";

const OPEN_STORAGE_KEY = "todex:docs-sidebar-open";
const WIDTH_STORAGE_KEY = "todex:docs-sidebar-width";

export function DocsModuleSidebar() {
  const pathname = usePathname() ?? "";
  const {
    state: { folders },
    actions: { createFolder },
  } = useDocs();
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);
  const [folderDraft, setFolderDraft] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(readOpen());
    setWidth(readWidth());
  }, []);

  return (
    <aside
      className={cn("relative flex h-full shrink-0 flex-col", !isOpen && "w-12")}
      style={isOpen ? { width } : undefined}
    >
      {isOpen ? (
        <ResizeHandle
          label="Resize sidebar"
          edge="trailing"
          width={width}
          min={TASKS_SIDEBAR_MIN_WIDTH}
          max={TASKS_SIDEBAR_MAX_WIDTH}
          onWidth={setWidth}
          onCommit={writeWidth}
        />
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-auto pb-3 pt-3",
          isOpen ? "px-3" : "px-1.5",
        )}
      >
        <section className="mb-4 w-full">
          {isOpen ? (
            <h2 className="mb-2 px-2 text-sm text-muted-foreground">Views</h2>
          ) : null}
          <SidebarLink
            href="/docs"
            label="All"
            active={pathname === "/docs"}
            collapsed={!isOpen}
            icon={<DocsIcon size={16} />}
          />
          <SidebarLink
            href="/docs/goals"
            label="Goals"
            active={pathname === "/docs/goals"}
            collapsed={!isOpen}
            icon={<StatusDoneIcon size={16} />}
          />
          <SidebarLink
            href="/docs/general"
            label="General"
            active={pathname === "/docs/general"}
            collapsed={!isOpen}
            icon={<DocsIcon size={16} />}
          />
        </section>
        <section className="flex min-h-0 w-full flex-1 flex-col">
          <div
            className={cn(
              "mb-2 flex items-center",
              isOpen ? "justify-between px-2" : "justify-center",
            )}
          >
            {isOpen ? (
              <h2 className="text-sm text-muted-foreground">Folders</h2>
            ) : null}
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
          {isOpen && folderDraft !== null ? (
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
              collapsed={!isOpen}
              icon={<FolderIcon size={16} />}
            />
          ))}
        </section>
      </div>
      <div className={cn("shrink-0 p-2", !isOpen && "px-1.5")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => {
                const next = !isOpen;
                setIsOpen(next);
                writeOpen(next);
              }}
            >
              <ChevronIcon size={14} className={isOpen ? "rotate-180" : undefined} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isOpen ? "Collapse sidebar" : "Expand sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  active,
  collapsed,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  icon: ReactNode;
}) {
  const row = (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "my-1 flex min-w-0 items-center gap-3 rounded-lg py-1.5 text-sm",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      {collapsed ? null : <span className="min-w-0 truncate">{label}</span>}
    </Link>
  );
  if (!collapsed) return row;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function readOpen() {
  try {
    return localStorage.getItem(OPEN_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeOpen(shouldOpen: boolean) {
  try {
    localStorage.setItem(OPEN_STORAGE_KEY, shouldOpen ? "true" : "false");
  } catch {
    /* private mode / quota */
  }
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
