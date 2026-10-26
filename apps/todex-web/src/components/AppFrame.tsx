"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";

import { ExecutionProvider, useExecution } from "../app/execution/execution-provider";
import { formatClock } from "../app/execution/execution-time";
import { AgentWidget } from "./agent-widget";
import { AppNavRail } from "./AppNavRail";
import { AuthGuard } from "./AuthGuard";
import { CreateMenu, CreateMenuProvider } from "./create-menu";
import { ExecutionIcon } from "./icons";
import { ModuleSidebarProvider, SidebarToggle } from "./module-sidebar";
import { PlatformSearchProvider, SearchButton } from "./platform-search";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/sign-in") {
    return <TooltipProvider>{children}</TooltipProvider>;
  }

  return (
    <TooltipProvider>
      <AuthGuard>
        <ExecutionProvider>
          <PlatformSearchProvider>
          <CreateMenuProvider>
          <ModuleSidebarProvider>
          <div className="flex h-screen flex-col overflow-hidden bg-background">
            <header className="flex h-12 shrink-0 items-center pr-2">
              <div className="flex w-12 shrink-0 items-center justify-center">
                <div className="h-10 w-10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static logo; next/image flashes on navigation */}
                  <img
                    src="/todex-uniform-logo.svg"
                    alt="Todex"
                    width={40}
                    height={40}
                    decoding="sync"
                    fetchPriority="high"
                    className="h-10 w-10 origin-center scale-[1.2] object-cover"
                  />
                </div>
              </div>
              <SidebarToggle />
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <ExecutionStatusBar />
                <SearchButton />
                <CreateMenu />
              </div>
            </header>
            <div className="flex min-h-0 min-w-0 flex-1">
              <AppNavRail />
              <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
            </div>
          </div>
          <AgentWidget />
          </ModuleSidebarProvider>
          </CreateMenuProvider>
          </PlatformSearchProvider>
        </ExecutionProvider>
      </AuthGuard>
    </TooltipProvider>
  );
}

function ExecutionStatusBar() {
  const pathname = usePathname();
  const {
    state: { session, tasks, focused },
    actions: { focus, pause, resume, complete },
    meta: { shownSeconds, tracking, isCompleting },
  } = useExecution();
  const active = pathname.startsWith("/execution");

  if (!session) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/execution/current"
            aria-label="Execution"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
              active && "bg-white/10 text-foreground",
            )}
          >
            <ExecutionIcon size={22} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom">Execution</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 min-w-0 max-w-xs items-center gap-2 rounded-lg px-2 text-foreground transition-colors hover:bg-white/5",
            active && "bg-white/10",
          )}
        >
          <ExecutionIcon size={22} />
          <span className="text-xs font-medium tabular-nums leading-none">
            {shownSeconds == null ? "—" : formatClock(shownSeconds)}
          </span>
          <span className="min-w-0 truncate text-sm">
            {focused?.summary ?? "Active execution"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/execution/current">Open</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => (tracking ? pause() : resume())}>
          {tracking ? "Pause" : "Resume"}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isCompleting} onSelect={() => complete()}>
          Stop
        </DropdownMenuItem>
        {tasks.length > 0 ? <DropdownMenuSeparator /> : null}
        {tasks.map((task) => (
          <DropdownMenuItem
            key={task.id}
            onSelect={() => focus(task.id)}
            className={cn(task.id === focused?.id && "font-medium")}
          >
            {task.summary}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
