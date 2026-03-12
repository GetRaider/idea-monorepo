import { styled } from "styled-components";

export const CharCounter = styled.div<{ $nearLimit: boolean }>`
  text-align: right;
  font-size: 12px;
  color: ${({ $nearLimit }) => ($nearLimit ? "#ef4444" : "#666")};
  margin-top: -16px;
  margin-bottom: 20px;
`;
