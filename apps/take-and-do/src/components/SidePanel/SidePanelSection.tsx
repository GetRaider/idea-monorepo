"use client";

import { cn } from "@/lib/styles/utils";

import {
  SidePanelSectionActions,
  SidePanelSectionContainer,
  SidePanelSectionHeader,
  SidePanelSectionHeaderRow,
} from "./SidePanel.ui";

import type { SidePanelSection } from "./SidePanel.types";

export function SidePanelSectionView({
  section,
  isOpen,
  onToggle,
  isFirst,
}: {
  section: SidePanelSection;
  isOpen: boolean;
  onToggle: () => void;
  isFirst: boolean;
}) {
  const collapsible = section.collapsible ?? true;
  const showTopBorder = section.showTopBorder ?? !isFirst;
  const hasActions = (section.actions?.length ?? 0) > 0;

  return (
    <SidePanelSectionContainer
      grow={section.grow}
      showTopBorder={showTopBorder}
      className={cn(section.grow && isOpen && "flex min-h-0 flex-1 flex-col")}
    >
      <SidePanelSectionHeaderRow>
        <SidePanelSectionHeader
          isExpanded={isOpen}
          onToggle={onToggle}
          title={section.title}
          collapsible={collapsible}
        />
        {section.headerActions}
        {hasActions ? (
          <SidePanelSectionActions actions={section.actions ?? []} />
        ) : null}
      </SidePanelSectionHeaderRow>

      {isOpen ? (
        <div
          className={cn(
            "min-h-0",
            section.grow && "flex min-h-0 flex-1 flex-col",
          )}
        >
          {section.body}
        </div>
      ) : null}
    </SidePanelSectionContainer>
  );
}
