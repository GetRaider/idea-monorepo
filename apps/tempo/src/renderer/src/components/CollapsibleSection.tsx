import { useState, type ReactNode } from "react";

import {
  SectionBody,
  SectionChevron,
  SectionHeader,
  SectionShell,
  SectionTitle,
  SectionToggle,
} from "./CollapsibleSection.styles";

export function CollapsibleSection({
  title,
  defaultExpanded = false,
  headerActions,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <SectionShell>
      <SectionHeader>
        <SectionToggle
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <SectionChevron $expanded={expanded}>▾</SectionChevron>
          <SectionTitle>{title}</SectionTitle>
        </SectionToggle>
        {headerActions ? <div>{headerActions}</div> : null}
      </SectionHeader>
      {expanded ? <SectionBody>{children}</SectionBody> : null}
    </SectionShell>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
}
