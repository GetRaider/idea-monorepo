import type { ReactNode, Ref } from "react";

import type { SidePanelSize } from "./side-panel-layout";

export type SidePanelSectionAction =
  | { type: "add"; onClick: () => void; label: string; title?: string }
  | { type: "info"; tooltip: string };

export type SidePanelSection = {
  id: string;
  title: string;
  body: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  actions?: SidePanelSectionAction[];
  headerActions?: ReactNode;
  grow?: boolean;
  showTopBorder?: boolean;
};

export type SidePanelCollapsePolicy =
  | { mode: "independent" }
  | { mode: "limited"; maxOpen: number; sectionOrder: string[] };

export type SidePanelA11yLabels = {
  hideTooltip: string;
  hideSrLabel: string;
  showTooltip: string;
  showSrLabel: string;
};

export type SidePanelVariant = "solid" | "glass";

export type SidePanelResponsiveMode = "stack" | "fixed";

export type SidePanelProps = {
  expanded: boolean;
  onRequestCollapse: () => void;
  onExpand: () => void;
  panelId: string;
  a11y: SidePanelA11yLabels;
  sections: SidePanelSection[];
  size?: SidePanelSize;
  variant?: SidePanelVariant;
  collapsePolicy?: SidePanelCollapsePolicy;
  responsive?: SidePanelResponsiveMode;
  mainRef?: Ref<HTMLDivElement | null>;
  panelInnerRef?: Ref<HTMLDivElement | null>;
  mainClassName?: string;
  mainBodyClassName?: string;
  children: ReactNode;
};
