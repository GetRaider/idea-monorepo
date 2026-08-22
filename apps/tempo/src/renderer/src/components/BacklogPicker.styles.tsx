import styled from "styled-components";

import { colors } from "../App.styles";

export const PickerHint = styled.p`
  margin: 0;
  color: ${colors.muted};
  font-size: 0.8rem;
`;

export const BacklogRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
`;

export const BacklogCard = styled.article<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(155, 92, 255, 0.55)" : "rgba(255, 255, 255, 0.08)"};
  border-radius: 18px;
  background: rgba(14, 10, 22, 0.92);
  overflow: hidden;
`;

export const BacklogAccent = styled.div<{ $color: string }>`
  height: 5px;
  background: ${({ $color }) => $color};
`;

export const BacklogCardInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.85rem 0.85rem 0.75rem;
`;

export const BacklogCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  min-width: 0;
`;

export const BacklogTitleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  flex: 1;
  border: 0;
  padding: 0;
  background: transparent;
  color: ${colors.text};
  text-align: left;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

export const BacklogColorDot = styled.span<{ $color: string }>`
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const BacklogCardName = styled.span`
  display: block;
  font-size: 0.98rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BacklogStartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 0.72rem 0.85rem;
  cursor: pointer;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: #fff;
  background: ${colors.purpleDeep};
  box-shadow: 0 8px 22px rgba(124, 58, 237, 0.22);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    box-shadow: 0 10px 28px rgba(124, 58, 237, 0.34);
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`;

export const BacklogStartContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
`;

export const BacklogDeleteRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
`;

export const BacklogActionButton = styled.button<{ $danger?: boolean }>`
  border: 0;
  border-radius: 10px;
  padding: 0.65rem 0.5rem;
  cursor: pointer;
  background: ${({ $danger }) => ($danger ? "#be123c" : colors.surfaceHover)};
  color: ${colors.text};
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
