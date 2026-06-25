"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties, LegacyRef, ReactNode, Ref } from "react";

import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import {
  tasksSidebarEdgeHideToggleClass,
  tasksSidebarEdgeShowToggleClass,
} from "@/components/TasksSidebar/tasks-sidebar-edge-toggle-classes";
import { cn } from "@/lib/styles/utils";

const SHELL_DEFAULT =
  "flex min-h-0 w-full flex-1 flex-col overflow-hidden max-lg:min-h-0 max-lg:flex-none max-lg:overflow-visible motion-reduce:transition-none lg:min-h-0 lg:max-h-full";

export type SidePanelProps = {
  /** When false, the hide chevron is not shown (panel already “closed” on desktop). */
  expanded: boolean;
  onRequestCollapse: () => void;
  onExpand: () => void;
  panelId: string;
  hideTooltip: string;
  hideSrLabel: string;
  showTooltip: string;
  showSrLabel: string;
  /** Outer column: width / opacity / transitions (layout-specific). */
  sidebarColumnClassName: string;
  sidebarColumnStyle?: CSSProperties;
  /** Inner flex shell; merged with defaults + `!expanded && lg:pointer-events-none`. */
  sidebarShellClassName?: string;
  /** Direct wrapper around `sidebar` (e.g. fixed min width for calendar). */
  sidebarContentClassName: string;
  /** Optional DOM id on the sidebar content wrapper (must match `panelId` when used for `aria-controls`). */
  sidebarContentId?: string;
  sidebar: ReactNode;
  mainRef?: Ref<HTMLDivElement | null>;
  mainClassName: string;
  /** If set, main `children` are wrapped in this inner div (e.g. tasks main scroll shell). */
  mainBodyClassName?: string;
  children: ReactNode;
};

/** @deprecated Use `SidePanelProps` */
export type CollapsibleSidePanelProps = SidePanelProps;

/** @deprecated Use `SidePanelProps` */
export type CollapsibleSidePanelMainProps = SidePanelProps;

export function SidePanel({
  expanded,
  onRequestCollapse,
  onExpand,
  panelId,
  hideTooltip,
  hideSrLabel,
  showTooltip,
  showSrLabel,
  sidebarColumnClassName,
  sidebarColumnStyle,
  sidebarShellClassName,
  sidebarContentClassName,
  sidebarContentId,
  sidebar,
  mainRef,
  mainClassName,
  mainBodyClassName,
  children,
}: SidePanelProps) {
  const collapsed = !expanded;

  return (
    <>
      <div className={sidebarColumnClassName} style={sidebarColumnStyle}>
        <div
          className={cn(
            SHELL_DEFAULT,
            !expanded && "lg:pointer-events-none",
            sidebarShellClassName,
          )}
        >
          <div
            {...(sidebarContentId != null ? { id: sidebarContentId } : {})}
            className={sidebarContentClassName}
          >
            {sidebar}
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

      <div
        {...(mainRef != null
          ? { ref: mainRef as LegacyRef<HTMLDivElement> }
          : {})}
        className={mainClassName}
      >
        {collapsed ? (
          <div className="pointer-events-none absolute inset-y-0 z-30 hidden left-[calc(-1.5rem-1px)] lg:flex lg:items-center">
            <AppTooltip content={showTooltip} side="right">
              <button
                type="button"
                onClick={onExpand}
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
        {mainBodyClassName ? (
          <div className={mainBodyClassName}>{children}</div>
        ) : (
          children
        )}
      </div>
    </>
  );
}
