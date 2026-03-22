import styled from "styled-components";

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

export const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    border-color: #7255c1;
    background: #252525;
  }

  option {
    background: #2a2a2a;
    color: #fff;
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
