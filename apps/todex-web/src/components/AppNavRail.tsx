"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";

import { signOut } from "@lib/auth-client";
import {
  CalendarIcon,
  DocsIcon,
  OverviewIcon,
  SettingsIcon,
  TasksIcon,
} from "./icons";

const NAV = [
  { href: "/overview", label: "Overview", enabled: true, icon: OverviewIcon },
  { href: "/tasks", label: "Tasks", enabled: true, icon: TasksIcon },
  { href: "/calendar", label: "Calendar", enabled: false, icon: CalendarIcon },
  { href: "/docs", label: "Docs", enabled: false, icon: DocsIcon },
] as const;

export function AppNavRail() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[60px] shrink-0 flex-col items-center border-r border-border bg-rail py-4">
      <Link
        href="/overview"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border text-xs font-semibold tracking-wide"
      >
        TD
      </Link>
      <nav className="flex flex-col gap-2">
        {NAV.map((item) => {
          const active =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const icon = <item.icon size={24} />;
          if (!item.enabled) {
            return (
              <RailTooltip
                key={item.href}
                label={`${item.label} — Coming soon`}
              >
                <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-muted opacity-30">
                  {icon}
                </span>
              </RailTooltip>
            );
          }
          return (
            <RailTooltip key={item.href} label={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground",
                  active &&
                    "bg-surface text-foreground before:absolute before:left-[-8px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-white before:content-['']",
                )}
              >
                {icon}
              </Link>
            </RailTooltip>
          );
        })}
      </nav>
      <div className="mt-auto">
        <RailTooltip label="Sign out">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <SettingsIcon size={22} />
          </button>
        </RailTooltip>
      </div>
    </aside>
  );
}

function RailTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
