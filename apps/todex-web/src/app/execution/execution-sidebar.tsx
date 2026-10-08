"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";

import { ClockIcon, RowsIcon, StatusDoneIcon } from "@components/icons";

const LINKS = [
  { href: "/execution/current", label: "Current", icon: ClockIcon },
  { href: "/execution/activity", label: "Activity", icon: RowsIcon },
  { href: "/execution/history", label: "History", icon: StatusDoneIcon },
] as const;

export function ExecutionSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="flex w-52 shrink-0 flex-col px-3 py-3">
      <h2 className="mb-2 px-3 text-sm text-muted-foreground">Execution</h2>
      <nav>
        {LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "my-1 flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm",
                active
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
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
