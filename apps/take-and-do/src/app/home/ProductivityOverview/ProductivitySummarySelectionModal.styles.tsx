"use client";

import styled, { css } from "styled-components";
import {
  animatedGradientBackground,
  animatedGradientHover,
} from "./animatedGradient";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 32px;
  max-width: 800px;
  width: 100%;
  min-height: 400px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: #fff;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  position: relative;
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  padding-right: 16px;
`;

export const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #fff;
`;

export const ModalDescription = styled.h3`
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: -4px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  flex: 1;
`;

export const OptionBlock = styled.div<{ $selected: boolean; $isAI?: boolean }>`
  position: relative;
  background: ${(props) => {
    if (props.$isAI) {
      return "transparent";
    }
    return "#2a2a2a";
  }};
  border: ${(props) => {
    // Same border logic for both AI and Basic - solid purple when selected
    return `2px solid ${props.$selected ? "#7255c1" : "#3a3a3a"}`;
  }};
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;

  /* Animated gradient background for AI option - always applied */
  ${(props) => props.$isAI && animatedGradientBackground}

  &:hover {
    ${(props) => {
      if (props.$isAI) {
        return animatedGradientHover;
      } else {
        return css`
          border-color: ${props.$selected ? "#7255c1" : "#4a4a4a"};
          background: ${props.$selected ? "#2a2a2a" : "#2f2f2f"};
        `;
      }
    }}
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    &::before {
      animation: none !important;
    }
  }
`;

export const OptionTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

export const OptionDescription = styled.p`
  margin: 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #2a2a2a;
`;

export const CancelButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    border-color: #4a4a4a;
  }
`;

export const SaveButton = styled.button`
  padding: 10px 20px;
  background: #7255c1;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #8255d1;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
