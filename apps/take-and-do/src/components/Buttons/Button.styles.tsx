import { styled } from "styled-components";

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #2a2a2a;
    color: #fff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Button = styled.button<{
  $disabled?: boolean;
  $background?: string;
}>`
  padding: 10px 20px;
  background: ${({ $background }) => $background || "transparent"};
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    border-color: #4a4a4a;
  }
`;
