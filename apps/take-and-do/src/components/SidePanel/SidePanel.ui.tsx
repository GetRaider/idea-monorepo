"use client";

import { ChevronRightIcon, InfoCircleIcon, PlusIcon } from "@/components/Icons";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

import type {
  SidePanelSectionAction,
  SidePanelVariant,
} from "./SidePanel.types";
import { SIDE_PANEL_SIZE_PX, type SidePanelSize } from "./side-panel-layout";

const SIDE_PANEL_SECTION_HEADER_TEXT_CLASS =
  "text-sm font-extrabold tracking-wide text-text-tertiary";

export function SidePanelAside({
  panelId,
  size,
  variant = "solid",
  className,
  ref,
  ...props
}: UiProps<"aside"> & {
  panelId: string;
  size: SidePanelSize;
  variant?: SidePanelVariant;
}) {
  const widthPx = SIDE_PANEL_SIZE_PX[size];

  return (
    <aside
      ref={ref}
      id={panelId}
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: widthPx,
        scrollbarGutter: variant === "glass" ? "stable" : undefined,
      }}
      className={cn(
        "relative z-0 flex min-h-0 w-full max-w-full flex-1 flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl p-3.5 max-[900px]:max-w-none",
        variant === "solid" && "border border-white/[0.06] bg-sidebar-bg",
        variant === "glass" &&
          "calendar-surface border border-white/10 bg-background-primary/85 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}

export function SidePanelSectionContainer({
  className,
  grow,
  showTopBorder,
  ref,
  ...props
}: UiProps<"div"> & {
  grow?: boolean;
  showTopBorder?: boolean;
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2",
        grow && "min-h-0 flex-1",
        showTopBorder && "border-t border-white/[0.08] pt-3",
        className,
      )}
      {...props}
    />
  );
}

export function SidePanelSectionHeaderRow({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 items-center justify-between gap-2 rounded-lg transition-colors hover:bg-white/[0.06]",
        className,
      )}
      {...props}
    />
  );
}

export function SidePanelSectionHeader({
  isExpanded,
  onToggle,
  title,
  collapsible = true,
  className,
  ref,
}: UiProps<"button"> & {
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
  collapsible?: boolean;
}) {
  if (!collapsible) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "flex min-w-0 flex-1 items-center py-1 pl-0 pr-1",
          SIDE_PANEL_SECTION_HEADER_TEXT_CLASS,
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
      </div>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1 rounded-lg border-0 bg-transparent py-1 pl-0 pr-1 text-left transition-colors",
        className,
      )}
    >
      <SidePanelSectionChevron isExpanded={isExpanded}>
        <ChevronRightIcon size={11} className="ml-1" />
      </SidePanelSectionChevron>
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          SIDE_PANEL_SECTION_HEADER_TEXT_CLASS,
        )}
      >
        {title}
      </span>
    </button>
  );
}

export function SidePanelSectionChevron({
  isExpanded,
  instant,
  className,
  ref,
  children,
}: UiProps<"span"> & {
  isExpanded?: boolean;
  instant?: boolean;
}) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-5 w-3.5 shrink-0 items-center justify-start text-text-secondary",
        instant
          ? "transition-none"
          : "transition-transform duration-200 ease-out",
        isExpanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...(children ? {} : { "aria-hidden": true })}
    >
      {children}
    </span>
  );
}

export function SidePanelAddButton({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-text-tertiary transition-all duration-200 hover:bg-[#1a1a1a] hover:text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function SidePanelSectionActions({
  actions,
}: {
  actions: SidePanelSectionAction[];
}) {
  if (actions.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {actions.map((action) => {
        if (action.type === "add") {
          return (
            <SidePanelAddButton
              key={`${action.type}-${action.label}`}
              onClick={action.onClick}
              title={action.title ?? action.label}
              aria-label={action.label}
              className="mr-1"
            >
              <PlusIcon size={16} />
            </SidePanelAddButton>
          );
        }

        return (
          <AppTooltip
            key={`${action.type}-${action.tooltip}`}
            content={action.tooltip}
          >
            <span className="inline-flex">
              <InfoCircleIcon size={16} className="text-zinc-500 mr-1" />
            </span>
          </AppTooltip>
        );
      })}
    </div>
  );
}
