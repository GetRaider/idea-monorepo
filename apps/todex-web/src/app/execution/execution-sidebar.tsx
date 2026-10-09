"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";

import { ClockIcon, RowsIcon, StatusDoneIcon } from "@components/icons";
import { ModuleSidebarFrame, useModuleSidebar } from "@components/module-sidebar";

const EXECUTION_SIDEBAR_WIDTH = 208;

const LINKS = [
  { href: "/execution/current", label: "Current", icon: ClockIcon },
  { href: "/execution/activity", label: "Activity", icon: RowsIcon },
  { href: "/execution/history", label: "History", icon: StatusDoneIcon },
] as const;

export function ExecutionSidebar() {
  const pathname = usePathname() ?? "";
  const { open } = useModuleSidebar();

  return (
    <ModuleSidebarFrame open={open} width={EXECUTION_SIDEBAR_WIDTH}>
      <div className="flex h-full flex-col px-3 py-3">
        <h2 className="mb-2 px-3 text-sm text-muted-foreground">Execution</h2>
        <nav>
          {LINKS.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
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
        "my-1 flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ExecutionCanvas({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </section>
  );
}
