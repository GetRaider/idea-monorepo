"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";

import { signOut, useSession } from "@lib/auth-client";

import {
  BellIcon,
  CalendarIcon,
  DocsIcon,
  OverviewIcon,
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
    <aside className="flex h-full w-12 shrink-0 flex-col items-center py-3 pl-2 pr-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- static logo; next/image flashes on navigation */}
      <img
        src="/logo.svg"
        alt="Todex"
        width={40}
        height={40}
        decoding="sync"
        fetchPriority="high"
        className="mb-2 h-10 w-10 shrink-0 object-contain"
      />
      <nav className="flex flex-col gap-2">
        {NAV.map((item) => {
          const active =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const icon = <item.icon size={22} />;
          if (!item.enabled) {
            return (
              <RailTooltip
                key={item.href}
                label={`${item.label} — Coming soon`}
              >
                <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-muted-foreground opacity-30">
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
                  "flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
                  active && "bg-white/10 text-foreground",
                )}
              >
                {icon}
              </Link>
            </RailTooltip>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col items-center gap-2">
        <NotificationsButton />
        <AccountAvatar />
      </div>
    </aside>
  );
}

function NotificationsButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Notifications"
        >
          <BellIcon size={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end">
        <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountAvatar() {
  const { data: session } = useSession();
  const initial = session?.user.name?.charAt(0).toUpperCase() || "T";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-foreground hover:bg-white/20"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right">
        <DropdownMenuItem onSelect={() => signOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
