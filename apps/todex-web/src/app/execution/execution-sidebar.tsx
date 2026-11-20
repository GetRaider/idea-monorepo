"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";

import { OrbitIcon, RowsIcon, StatusDoneIcon } from "@components/icons";
import { ModuleSidebarFrame, useModuleSidebar } from "@components/module-sidebar";

const EXECUTION_SIDEBAR_WIDTH = 208;

const LINKS = [
  { href: "/execution", label: "Home", icon: OrbitIcon, exact: true },
  { href: "/execution/activity", label: "Activity", icon: RowsIcon, exact: false },
  { href: "/execution/history", label: "History", icon: StatusDoneIcon, exact: false },
] as const;

export function ExecutionSidebar() {
  const pathname = usePathname() ?? "";
  const { open } = useModuleSidebar();

  return (
    <ModuleSidebarFrame open={open} width={EXECUTION_SIDEBAR_WIDTH}>
      <div className="flex h-full flex-col px-3 pb-3 pt-3">
        <h2 className="mb-2 px-2 text-sm text-muted-foreground">Views</h2>
        <nav className="flex flex-col">
          {LINKS.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href, link.exact)}
              icon={<link.icon size={16} />}
            />
          ))}
        </nav>
      </div>
    </ModuleSidebarFrame>
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
      className={cn(
        "my-0.5 flex items-center gap-2 rounded-md px-2 py-2 text-sm",
        active
          ? "bg-surface font-medium text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function isActive(pathname: string, href: string, exact: boolean) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (exact) return normalized === href;
  return normalized === href || normalized.startsWith(`${href}/`);
}
