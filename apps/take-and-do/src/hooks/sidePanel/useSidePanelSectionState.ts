"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  SidePanelCollapsePolicy,
  SidePanelSection,
} from "@/components/SidePanel/SidePanel.types";

export function useSidePanelSectionState(
  sections: SidePanelSection[],
  collapsePolicy: SidePanelCollapsePolicy = { mode: "independent" },
) {
  const defaultOpenById = useMemo(
    () =>
      Object.fromEntries(
        sections.map((section) => [section.id, section.defaultOpen ?? true]),
      ),
    [sections],
  );

  const [openById, setOpenById] =
    useState<Record<string, boolean>>(defaultOpenById);

  const toggleSection = useCallback(
    (sectionId: string) => {
      setOpenById((previous) => {
        const isOpen = previous[sectionId] ?? false;

        if (collapsePolicy.mode === "independent") {
          return { ...previous, [sectionId]: !isOpen };
        }

        if (isOpen) {
          return { ...previous, [sectionId]: false };
        }

        let next = { ...previous, [sectionId]: true };
        const sectionOrder = collapsePolicy.sectionOrder;
        while (
          sectionOrder.filter((id) => next[id]).length > collapsePolicy.maxOpen
        ) {
          const victim = sectionOrder.find(
            (id) => next[id] && id !== sectionId,
          );
          if (!victim) break;
          next = { ...next, [victim]: false };
        }
        return next;
      });
    },
    [collapsePolicy],
  );

  const isSectionOpen = useCallback(
    (sectionId: string) => openById[sectionId] ?? false,
    [openById],
  );

  return { isSectionOpen, toggleSection };
}
