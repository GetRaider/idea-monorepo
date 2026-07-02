"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/Icons";
import {
  appChromeHeadingCurrentClass,
  appChromeHeadingLinkClass,
} from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

export type TasksBreadcrumb = {
  label: string;
  href?: string;
  leading?: ReactNode;
};

export function TasksBreadcrumbs({
  breadcrumbs,
  className,
}: {
  breadcrumbs: TasksBreadcrumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0">
        {breadcrumbs.map((item, i) => {
          const isLast = i === breadcrumbs.length - 1;
          const showLink = Boolean(item.href) && !isLast;
          return (
            <li
              key={`${item.label}-${i}`}
              className={cn("flex min-w-0 items-center", i > 0 && "gap-x-2")}
            >
              {i > 0 ? (
                <span
                  className="inline-flex shrink-0 items-center justify-center px-1.5 text-zinc-400"
                  aria-hidden
                >
                  <ChevronRightIcon
                    size={16}
                    strokeWidth={2.5}
                    className="shrink-0"
                  />
                </span>
              ) : null}
              {showLink ? (
                <Link
                  href={item.href!}
                  className={cn(
                    "flex min-w-0 max-w-full items-center gap-2 truncate",
                    appChromeHeadingLinkClass,
                  )}
                >
                  {item.leading ? (
                    <span className="inline-flex shrink-0 items-center justify-center text-zinc-400 [&>svg]:shrink-0">
                      {item.leading}
                    </span>
                  ) : null}
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex min-w-0 max-w-full items-center gap-2 truncate",
                    appChromeHeadingCurrentClass,
                  )}
                  {...(isLast ? { "aria-current": "page" as const } : {})}
                >
                  {item.leading ? (
                    <span className="inline-flex shrink-0 items-center justify-center text-zinc-300 [&>svg]:shrink-0">
                      {item.leading}
                    </span>
                  ) : null}
                  <span className="min-w-0 truncate">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
