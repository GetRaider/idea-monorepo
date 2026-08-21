import styled from "styled-components";

export const SectionShell = styled.section`
  overflow: hidden;
  border: 1px solid #27272a;
  border-radius: 12px;
  background: #18181b;
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
  color: #71717a;
  font-size: 0.7rem;
  transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
`;

export const SectionTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #a1a1aa;
`;

export const SectionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid #27272a;
  padding: 1rem;
`;
