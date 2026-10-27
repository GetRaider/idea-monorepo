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
          <div className="app-chrome flex h-screen flex-col overflow-hidden">
            <header className="flex h-14 shrink-0 items-center px-4">
              <div className="flex shrink-0 items-center gap-2.5">
                <div className="size-10 shrink-0 overflow-hidden rounded-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static logo; next/image flashes on navigation */}
                  <img
                    src="/todex-silver-stroke-default.png"
                    alt="Todex"
                    width={40}
                    height={40}
                    decoding="sync"
                    fetchPriority="high"
                    className="size-10 origin-center scale-[1.18] object-cover"
                  />
                </div>
                <SidebarToggle />
              </div>
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <ExecutionStatusBar />
                <SearchButton />
                <CreateMenu />
              </div>
            </header>
            <div className="flex min-h-0 min-w-0 flex-1 pl-1.5">
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
  const active =
    pathname === "/execution" || pathname.startsWith("/execution/");

  if (!session) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/execution/current"
            aria-label="Execution"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-[#c8c8c4] transition-colors hover:bg-white/5 hover:text-foreground",
              active &&
                "bg-[#f2f2f0] text-[#141414] hover:bg-[#f2f2f0] hover:text-[#141414]",
            )}
          >
            <ExecutionIcon size={20} />
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
            "flex h-8 min-w-0 max-w-xs items-center gap-2 rounded-lg px-2 text-[#c8c8c4] transition-colors hover:bg-white/5 hover:text-foreground",
            active &&
              "bg-[#f2f2f0] text-[#141414] hover:bg-[#f2f2f0] hover:text-[#141414]",
          )}
        >
          <ExecutionIcon size={20} />
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
