import styled from "styled-components";

import { colors } from "../App.styles";

export const MenuRoot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const MenuTrigger = styled.button`
  border: 0;
  width: 2rem;
  height: 100%;
  min-height: 2rem;
  border-radius: 8px;
  background: transparent;
  color: ${colors.muted};
  cursor: pointer;
  font-size: 1.15rem;
  line-height: 1;
  letter-spacing: 0.02em;

  &:hover:not(:disabled) {
    color: ${colors.text};
    background: ${colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const MenuPanel = styled.div<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => `${$top}px`};
  right: ${({ $right }) => `${$right}px`};
  z-index: 20;
  min-width: 7.5rem;
  padding: 0.25rem;
  border-radius: 10px;
  border: 1px solid ${colors.border};
  background: ${colors.surface};
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
  display: block;
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  text-align: left;
  cursor: pointer;
  background: transparent;
  color: ${({ $danger }) => ($danger === true ? colors.danger : colors.text)};
  font-size: 0.8rem;

  &:hover:not(:disabled) {
    background: ${colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
