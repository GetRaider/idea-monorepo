"use client";

import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #1e1e1e;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #2a2a2a;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

export const TextArea = styled.textarea.attrs({
  maxLength: 700,
})`
  width: 100%;
  min-height: 200px;
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 20px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #666;
    white-space: pre-line;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

export const CreateButton = styled.button`
  padding: 10px 20px;
  background: #7255c1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #5a42a1;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const DialogBodyFixed = styled.div`
  min-height: 280px;
`;

export const ProgressState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 280px;
`;

export const ProgressBarWrapper = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  margin-bottom: 20px;
`;

export const ProgressSegment = styled.div<{
  $filled?: boolean;
  $active?: boolean;
}>`
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: ${(p) =>
    p.$filled
      ? p.$active
        ? "linear-gradient(90deg, #667eea, #764ba2)"
        : "linear-gradient(90deg, #5a67d8, #6b46c1)"
      : "#2a2a2a"};
  transition: background 0.25s ease;
`;

export const ProgressLabel = styled.div`
  color: #888;
  font-size: 14px;
  font-weight: 500;
`;
