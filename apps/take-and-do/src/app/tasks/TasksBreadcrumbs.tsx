"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/styles/utils";

export type TasksBreadcrumbSegment = {
  label: string;
  href?: string;
  /** Shown before the label (e.g. board emoji, schedule icon). */
  leading?: ReactNode;
};

export function TasksBreadcrumbs({
  segments,
  className,
}: {
  segments: TasksBreadcrumbSegment[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-xl font-bold sm:text-2xl">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const showLink = Boolean(seg.href) && !isLast;
          return (
            <li
              key={`${seg.label}-${i}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {i > 0 ? (
                <span
                  className="shrink-0 font-semibold text-white/35"
                  aria-hidden
                >
                  /
                </span>
              ) : null}
              {showLink ? (
                <Link
                  href={seg.href!}
                  className="flex min-w-0 max-w-full items-center gap-2 truncate text-white underline-offset-4 transition-opacity hover:opacity-90"
                >
                  {seg.leading ? (
                    <span className="inline-flex shrink-0 items-center justify-center text-white">
                      {seg.leading}
                    </span>
                  ) : null}
                  {seg.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex min-w-0 max-w-full items-center gap-2 truncate text-white",
                  )}
                  {...(isLast ? { "aria-current": "page" as const } : {})}
                >
                  {seg.leading ? (
                    <span className="inline-flex shrink-0 items-center justify-center text-white">
                      {seg.leading}
                    </span>
                  ) : null}
                  {seg.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
