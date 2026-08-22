import styled from "styled-components";

export const HistoryList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: none;
  overflow: auto;
`;

export const HistoryRow = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: #16101f;
  border: 1px solid rgba(155, 92, 255, 0.18);
`;

export const HistoryMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
`;

export const HistoryColorDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const HistoryText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const HistoryName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const HistoryDetail = styled.span`
  color: #9b8fb0;
  font-size: 0.75rem;
`;

export const HistoryActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
`;

export const HistoryButton = styled.button<{ $danger?: boolean }>`
  border: 0;
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  cursor: pointer;
  background: ${({ $danger }) => ($danger ? "#be123c" : "#2a1f3d")};
  color: #f4eefe;
  font-size: 0.75rem;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const ManualBadge = styled.span`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.4rem;
  border-radius: 999px;
  background: #6d28d9;
  color: #f4eefe;
`;

export const ModeBadge = styled.span`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.4rem;
  border-radius: 999px;
  background: #2a1f3d;
  color: #f4eefe;
`;

export const HistoryFilters = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
`;

export const EmptyHistory = styled.p`
  margin: 0;
  color: #9b8fb0;
  font-size: 0.875rem;
`;
