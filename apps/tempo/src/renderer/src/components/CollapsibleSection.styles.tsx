import styled from "styled-components";

import { colors } from "../App.styles";

export const SectionShell = styled.section`
  overflow: hidden;
  margin-top: 0.5rem;
  border: 1px solid rgba(155, 92, 255, 0.16);
  border-radius: 14px;
  background: rgba(12, 8, 18, 0.55);
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
`;

export const SectionToggle = styled.button`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  cursor: pointer;
  text-align: left;
`;

export const SectionChevron = styled.span<{ $expanded: boolean }>`
  display: inline-block;
  color: ${colors.muted};
  font-size: 0.7rem;
  transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "-90deg")});
`;

export const SectionTitle = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${colors.muted};
`;

export const SectionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid rgba(155, 92, 255, 0.12);
  padding: 1rem;
`;
