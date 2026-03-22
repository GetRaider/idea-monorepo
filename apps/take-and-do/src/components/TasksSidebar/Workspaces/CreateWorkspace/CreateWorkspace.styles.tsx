import styled from "styled-components";

import { Input as BaseInput } from "@/components/Input";

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

export const Input = styled(BaseInput)`
  border-radius: 8px;
  transition: all 0.2s;

  &:focus {
    border-color: #7255c1;
    background: #252525;
  }
`;

export const TypeSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

export const TypeButton = styled.button<{ $selected?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  background: ${(p) => (p.$selected ? "#2a2540" : "#1e1e1e")};
  border: 1px solid ${(p) => (p.$selected ? "#7255c1" : "#2a2a2a")};
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$selected ? "#2a2540" : "#252525")};
    border-color: ${(p) => (p.$selected ? "#7255c1" : "#3a3a3a")};
  }

  img {
    width: 20px;
    height: 20px;
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
