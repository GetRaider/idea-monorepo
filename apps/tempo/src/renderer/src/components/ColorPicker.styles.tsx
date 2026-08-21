import styled from "styled-components";

import { colors } from "../App.styles";

export const ColorPickerRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

export const ColorPickerLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: ${colors.muted};
`;

export const ColorPreview = styled.span<{ $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: ${({ $color }) => $color};
`;

export const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem;
`;

export const ColorOption = styled.button<{ $color: string; $active: boolean }>`
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid
    ${({ $active }) => ($active === true ? colors.text : "transparent")};
  background: ${({ $color }) => $color};
  cursor: pointer;
  opacity: ${({ $active }) => ($active === true ? 1 : 0.85)};

  &:hover {
    opacity: 1;
  }
`;
