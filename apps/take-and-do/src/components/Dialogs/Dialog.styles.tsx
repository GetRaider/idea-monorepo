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
  z-index: 1000;
  padding: 20px;

  @media (max-width: 600px) {
    padding: 10px;
  }
`;

export const DialogContainer = styled.div<{ $maxWidth?: number }>`
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: ${({ $maxWidth = 500 }) => $maxWidth}px;
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
