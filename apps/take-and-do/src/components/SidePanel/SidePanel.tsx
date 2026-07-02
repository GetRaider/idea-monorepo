"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LegacyRef } from "react";

import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { cn } from "@/lib/styles/utils";

import {
  sidePanelEdgeHideToggleClass,
  sidePanelEdgeShowToggleClass,
} from "./side-panel-edge-toggle-classes";
import {
  getSidePanelColumnClassName,
  getSidePanelColumnStyle,
  getSidePanelContentMinWidthStyle,
} from "./side-panel-column-classes";
import { SIDE_PANEL_SIZE_PX } from "./side-panel-layout";
import { SidePanelAside } from "./SidePanel.ui";
import { SidePanelSectionView } from "./SidePanelSection";
import { useSidePanelSectionState } from "@/hooks/sidePanel/useSidePanelSectionState";

import type { SidePanelProps } from "./SidePanel.types";

const SHELL_DEFAULT =
  "flex min-h-0 w-full flex-1 flex-col overflow-hidden max-lg:min-h-0 max-lg:flex-none max-lg:overflow-visible motion-reduce:transition-none lg:min-h-0 lg:max-h-full";

export function SidePanel({
  expanded,
  onRequestCollapse,
  onExpand,
  panelId,
  a11y,
  sections,
  size = "default",
  variant = "solid",
  collapsePolicy = { mode: "independent" },
  responsive = "fixed",
  mainRef,
  panelInnerRef,
  mainClassName = "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible",
  mainBodyClassName,
  children,
}: SidePanelProps) {
  const collapsed = !expanded;
  const panelWidthPx = SIDE_PANEL_SIZE_PX[size];
  const { isSectionOpen, toggleSection } = useSidePanelSectionState(
    sections,
    collapsePolicy,
  );

  return (
    <>
      <div
        className={getSidePanelColumnClassName(expanded, responsive)}
        style={getSidePanelColumnStyle(expanded, panelWidthPx)}
      >
        <div
          className={cn(SHELL_DEFAULT, !expanded && "lg:pointer-events-none")}
        >
          <div
            className="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden lg:min-h-0 lg:max-h-full"
            style={getSidePanelContentMinWidthStyle(
              expanded,
              responsive,
              panelWidthPx,
            )}
          >
            <SidePanelAside panelId={panelId} size={size} variant={variant}>
              <div
                {...(panelInnerRef != null
                  ? { ref: panelInnerRef as LegacyRef<HTMLDivElement> }
                  : {})}
                className="contents"
              >
                {sections.map((section, index) => (
                  <SidePanelSectionView
                    key={section.id}
                    section={section}
                    isOpen={isSectionOpen(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    isFirst={index === 0}
                  />
                ))}
              </div>
            </SidePanelAside>
          </div>
        </div>
        {expanded ? (
          <div className="pointer-events-none absolute inset-y-0 left-full z-30 hidden lg:flex lg:items-center">
            <AppTooltip content={a11y.hideTooltip} side="right">
              <button
                type="button"
                onClick={onRequestCollapse}
                aria-expanded
                aria-controls={panelId}
                className={cn(
                  sidePanelEdgeHideToggleClass,
                  "rounded-l-none border-l-0 -translate-x-px",
                )}
              >
                <span className="sr-only">{a11y.hideSrLabel}</span>
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
            <AppTooltip content={a11y.showTooltip} side="right">
              <button
                type="button"
                onClick={onExpand}
                aria-expanded={false}
                aria-controls={panelId}
                className={sidePanelEdgeShowToggleClass}
              >
                <span className="sr-only">{a11y.showSrLabel}</span>
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
