"use client";

import { useState, type ReactNode } from "react";

import { ChevronDownIcon } from "@/components/Icons";
import { APP_CHROME_SECTION_TITLE_SIZE } from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

export function FocusCollapsibleSection({
  title,
  defaultExpanded = false,
  headerActions,
  children,
  className,
}: FocusCollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((previous) => !previous)}
          className="flex min-w-0 flex-1 items-center gap-2 border-0 bg-transparent p-0 text-left transition-colors hover:opacity-90"
        >
          <ChevronDownIcon
            size={14}
            className={cn(
              "shrink-0 text-text-secondary transition-transform",
              expanded ? "rotate-180" : "rotate-0",
            )}
          />
          <span className={cn("m-0", APP_CHROME_SECTION_TITLE_SIZE)}>
            {title}
          </span>
        </button>

        {headerActions ? (
          <div className="shrink-0">
            {typeof headerActions === "function"
              ? headerActions(expanded)
              : headerActions}
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-t border-white/10 px-5 py-4">{children}</div>
      ) : null}
    </section>
  );
}

interface FocusCollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  headerActions?: ReactNode | ((expanded: boolean) => ReactNode);
  children: ReactNode;
  className?: string;
}
