import { styled } from "styled-components";

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
