"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LegacyRef, ReactNode, Ref } from "react";

import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import {
  tasksSidebarEdgeHideToggleClass,
  tasksSidebarEdgeShowToggleClass,
} from "@/components/TasksSidebar/tasks-sidebar-edge-toggle-classes";
import { cn } from "@/lib/styles/utils";

const SHELL_DEFAULT =
  "flex min-h-0 w-full flex-1 flex-col overflow-hidden max-lg:min-h-0 max-lg:flex-none max-lg:overflow-visible motion-reduce:transition-none lg:min-h-0 lg:max-h-full";

export type CollapsibleSidePanelProps = {
  /** When false, the hide chevron is not shown (panel already “closed” on desktop). */
  expanded: boolean;
  onRequestCollapse: () => void;
  panelId: string;
  hideTooltip: string;
  hideSrLabel: string;
  /** Outer column: width / opacity / transitions (layout-specific). */
  columnClassName: string;
  columnStyle?: React.CSSProperties;
  /** Inner flex shell; merged with defaults + `!expanded && lg:pointer-events-none`. */
  shellClassName?: string;
  /** Direct wrapper around `children` (e.g. fixed min width for calendar). */
  contentClassName: string;
  /** Optional DOM id on the content wrapper (must match `panelId` when used for `aria-controls`). */
  contentId?: string;
  children: ReactNode;
};

export function CollapsibleSidePanel({
  expanded,
  onRequestCollapse,
  panelId,
  hideTooltip,
  hideSrLabel,
  columnClassName,
  columnStyle,
  shellClassName,
  contentClassName,
  contentId,
  children,
}: CollapsibleSidePanelProps) {
  return (
    <div className={columnClassName} style={columnStyle}>
      <div
        className={cn(
          SHELL_DEFAULT,
          !expanded && "lg:pointer-events-none",
          shellClassName,
        )}
      >
        <div
          {...(contentId != null ? { id: contentId } : {})}
          className={contentClassName}
        >
          {children}
        </div>
      </div>
      {expanded ? (
        <div className="pointer-events-none absolute inset-y-0 left-full z-30 hidden lg:flex lg:items-center">
          <AppTooltip content={hideTooltip} side="right">
            <button
              type="button"
              onClick={onRequestCollapse}
              aria-expanded
              aria-controls={panelId}
              className={cn(
                tasksSidebarEdgeHideToggleClass,
                "rounded-l-none border-l-0 -translate-x-px",
              )}
            >
              <span className="sr-only">{hideSrLabel}</span>
              <ChevronLeft
                size={13}
                strokeWidth={2.25}
                className="shrink-0 transition-colors group-hover:text-zinc-100"
                aria-hidden
              />
            </button>
          </AppTooltip>
        </div>
      ) : null}
    </div>
  );
}

export type CollapsibleSidePanelMainProps = {
  /** When true, sidebar is collapsed and the “show panel” chevron appears (lg+). */
  collapsed: boolean;
  onRequestExpand: () => void;
  panelId: string;
  showTooltip: string;
  showSrLabel: string;
  rootRef?: Ref<HTMLDivElement | null>;
  rootClassName: string;
  /** If set, children are wrapped in this inner div (e.g. tasks main scroll shell). */
  bodyClassName?: string;
  children: ReactNode;
};

export function CollapsibleSidePanelMain({
  collapsed,
  onRequestExpand,
  panelId,
  showTooltip,
  showSrLabel,
  rootRef,
  rootClassName,
  bodyClassName,
  children,
}: CollapsibleSidePanelMainProps) {
  return (
    <div
      {...(rootRef != null
        ? { ref: rootRef as LegacyRef<HTMLDivElement> }
        : {})}
      className={rootClassName}
    >
      {collapsed ? (
        <div className="pointer-events-none absolute inset-y-0 z-30 hidden left-[calc(-1.5rem-1px)] lg:flex lg:items-center">
          <AppTooltip content={showTooltip} side="right">
            <button
              type="button"
              onClick={onRequestExpand}
              aria-expanded={false}
              aria-controls={panelId}
              className={tasksSidebarEdgeShowToggleClass}
            >
              <span className="sr-only">{showSrLabel}</span>
              <ChevronRight
                size={13}
                strokeWidth={2.25}
                className="shrink-0 transition-colors group-hover:text-zinc-100"
                aria-hidden
              />
            </button>
          </AppTooltip>
        </div>
      ) : null}
      {bodyClassName ? (
        <div className={bodyClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
