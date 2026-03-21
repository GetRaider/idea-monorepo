import { styled } from "styled-components";

export const DialogOverlay = styled.div`
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
  z-index: 4000;
  padding: 20px;

  @media (max-width: 600px) {
    padding: 10px;
  }
`;

export const DialogContainer = styled.div<{
  $maxWidth?: number;
  $minHeight?: number;
}>`
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: ${({ $maxWidth = 500 }) => $maxWidth}px;
  min-height: ${({ $minHeight }) => ($minHeight ? `${$minHeight}px` : "0")};
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    max-height: 95vh;
    border-radius: 8px;
  }
`;

export const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const DialogTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

export const DialogBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

export const ConfirmBody = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.5;
`;

export const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const ConfirmCancelBtn = styled.button`
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid #7255c1;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:disabled:hover {
    background: transparent;
    color: #888;
  }
`;

export const ConfirmDangerBtn = styled.button`
  padding: 10px 20px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #dc2626;
  }

  &:focus-visible {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:disabled:hover {
    background: #ef4444;
  }
`;
