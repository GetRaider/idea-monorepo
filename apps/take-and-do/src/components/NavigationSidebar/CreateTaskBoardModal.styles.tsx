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

  @media (max-width: 600px) {
    padding: 10px;
  }
`;

export const ModalContainer = styled.div`
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
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

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
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
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #888;
  margin-bottom: 8px;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #7255c1;
    background: #252525;
  }

  &::placeholder {
    color: #666;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

export const Button = styled.button<{ $primary?: boolean }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$primary
      ? `
    background: #7255c1;
    color: #fff;
    
    &:hover:not(:disabled) {
      background: #5a42a1;
    }
    
    &:disabled {
      background: #2a2a2a;
      color: #666;
      cursor: not-allowed;
    }
  `
      : `
    background: transparent;
    color: #888;
    border: 1px solid #2a2a2a;
    
    &:hover {
      background: #2a2a2a;
      color: #fff;
    }
  `}
`;
