"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";

import { useOpenCreateMenu } from "@components/create-menu";
import { ClockIcon, RowsIcon, StatusDoneIcon } from "@components/icons";
import { ModuleSidebarFrame, useModuleSidebar } from "@components/module-sidebar";
import { NewButton } from "@components/new-button";

const EXECUTION_SIDEBAR_WIDTH = 208;

const LINKS = [
  { href: "/execution/current", label: "Execution", icon: ClockIcon },
  { href: "/execution/activity", label: "Activity", icon: RowsIcon },
  { href: "/execution/history", label: "History", icon: StatusDoneIcon },
] as const;

export function ExecutionSidebar() {
  const pathname = usePathname() ?? "";
  const { open } = useModuleSidebar();

  return (
    <ModuleSidebarFrame open={open} width={EXECUTION_SIDEBAR_WIDTH}>
      <div className="flex h-full flex-col px-3 pb-3 pt-3">
        <h2 className="mb-2 px-2 text-sm text-muted-foreground">Focus</h2>
        <nav className="flex flex-col">
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

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ExecutionCanvas({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const openCreateMenu = useOpenCreateMenu();

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-3">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions ?? <NewButton onClick={openCreateMenu} />}
      </div>
      {children}
    </section>
  );
}
