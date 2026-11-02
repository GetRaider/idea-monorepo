"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";

import { SidebarToggleIcon } from "./icons";
import { ResizeGestureContext } from "./resize-handle";

export function ModuleSidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const moduleKey = moduleForPath(pathname);
  const disabled = moduleKey != null && SIDEBAR_DISABLED.has(moduleKey);
  const [openState, setOpenState] = useState(true);

  useEffect(() => {
    if (!moduleKey || disabled) return;
    setOpenState(readOpen(moduleKey));
  }, [moduleKey, disabled]);

  function setOpen(next: boolean) {
    if (disabled) return;
    setOpenState(next);
    if (moduleKey) writeOpen(moduleKey, next);
  }

  return (
    <ModuleSidebarContext
      value={{
        moduleKey,
        open: disabled ? false : openState,
        setOpen,
        disabled,
      }}
    >
      {children}
    </ModuleSidebarContext>
  );
}

export function ModuleSidebarFrame({
  open,
  width,
  children,
}: ModuleSidebarFrameProps) {
  const [resizing, setResizing] = useState(false);

  return (
    <ResizeGestureContext value={setResizing}>
      <aside
        aria-hidden={open ? undefined : true}
        inert={open ? undefined : true}
        className={cn(
          "h-full shrink-0 overflow-hidden",
          resizing
            ? "transition-none"
            : "transition-[width] duration-200 ease-[cubic-bezier(0.32,_0.72,_0,_1)] motion-reduce:transition-none",
        )}
        style={{ width: open ? width : 0 }}
      >
        <div
          className="relative flex h-full min-h-0 flex-col"
          style={{ width }}
        >
          {children}
        </div>
      </aside>
    </ResizeGestureContext>
  );
}

export function useModuleSidebar() {
  const value = use(ModuleSidebarContext);
  if (!value) {
    throw new Error(
      "useModuleSidebar must be used within ModuleSidebarProvider",
    );
  }
  return value;
}

export function SidebarToggle() {
  const { moduleKey, open, setOpen, disabled } = useModuleSidebar();
  if (!moduleKey) return null;

  const label = sidebarToggleLabel(disabled, open);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <button
            type="button"
            disabled={disabled}
            aria-label={label}
            aria-pressed={disabled ? undefined : open}
            onClick={() => setOpen(!open)}
            className={cn(
              "flex size-11 items-center justify-center rounded-lg text-[#cfcfcc] transition-colors",
              disabled
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/5 hover:text-foreground",
            )}
          >
            <SidebarToggleIcon open={open} size={16} />
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function sidebarToggleLabel(disabled: boolean, open: boolean) {
  if (disabled) return "Sidebar unavailable";
  if (open) return "Collapse sidebar";
  return "Expand sidebar";
}

function moduleForPath(pathname: string): ModuleKey | null {
  if (pathname.startsWith("/planning")) return "tasks";
  if (pathname.startsWith("/knowledge")) return "docs";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/execution")) return "execution";
  if (pathname.startsWith("/overview")) return "overview";
  return null;
}

function readOpen(moduleKey: ModuleKey) {
  try {
    return localStorage.getItem(OPEN_KEYS[moduleKey]) !== "false";
  } catch {
    return true;
  }
}

function writeOpen(moduleKey: ModuleKey, shouldOpen: boolean) {
  try {
    localStorage.setItem(OPEN_KEYS[moduleKey], shouldOpen ? "true" : "false");
  } catch {
    /* private mode / quota */
  }
}

const SIDEBAR_DISABLED = new Set<ModuleKey>(["overview"]);

const OPEN_KEYS = {
  tasks: "todex:tasks-sidebar-open",
  docs: "todex:docs-sidebar-open",
  calendar: "todex:calendar-sidebar-open",
  execution: "todex:execution-sidebar-open",
  overview: "todex:overview-sidebar-open",
} as const;

const ModuleSidebarContext = createContext<ModuleSidebarContextValue | null>(
  null,
);

interface ModuleSidebarFrameProps {
  open: boolean;
  width: number;
  children: ReactNode;
}

interface ModuleSidebarContextValue {
  moduleKey: ModuleKey | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
}

type ModuleKey = keyof typeof OPEN_KEYS;
