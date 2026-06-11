"use client";

import { useState, type ReactNode } from "react";

import { ChevronDownIcon } from "@/components/Icons";
import { APP_CHROME_SECTION_TITLE_SIZE } from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

export function FocusCollapsibleSection({
  title,
  defaultExpanded = false,
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
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((previous) => !previous)}
        className="flex w-full items-center gap-2 border-0 bg-transparent px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
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

      {expanded ? (
        <div className="border-t border-white/10 px-4 py-4">{children}</div>
      ) : null}
    </section>
  );
}

interface FocusCollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}
