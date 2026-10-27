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
  KnowledgeIcon,
  OverviewIcon,
  PlanningIcon,
} from "./icons";

const NAV = [
  { href: "/overview", label: "Overview", enabled: true, icon: OverviewIcon },
  { href: "/planning", label: "Planning", enabled: true, icon: PlanningIcon },
  { href: "/calendar", label: "Calendar", enabled: true, icon: CalendarIcon },
  { href: "/knowledge", label: "Knowledge", enabled: true, icon: KnowledgeIcon },
] as const;

export function AppNavRail() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[53px] shrink-0 flex-col items-center px-[10px] pb-4">
      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const icon = <item.icon size={20} />;
          if (!item.enabled) {
            return (
              <RailTooltip
                key={item.href}
                label={`${item.label} — Coming soon`}
              >
                <span className="flex size-8 cursor-not-allowed items-center justify-center rounded-lg text-[#a3a3a0] opacity-30">
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
                  "flex size-8 items-center justify-center rounded-lg text-[#c8c8c4] transition-colors hover:bg-white/5 hover:text-foreground",
                  active && "bg-[#f2f2f0] text-[#141414] hover:bg-[#f2f2f0] hover:text-[#141414]",
                )}
              >
                {icon}
              </Link>
            </RailTooltip>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col items-center gap-1.5">
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
          className="flex size-8 items-center justify-center rounded-2xl text-[#c8c8c4] transition-colors hover:bg-white/5 hover:text-foreground"
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
          className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-[linear-gradient(140deg,#5a5a58_4%,#262625_96%)] text-sm font-semibold text-[#f2f2f0]"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right">
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
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
