import styled from "styled-components";

export const ToggleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  padding: 0.28rem;
  border-radius: 999px;
  background: rgba(12, 8, 18, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const ToggleButton = styled.button<{ $active: boolean }>`
  border: 0;
  border-radius: 999px;
  padding: 0.72rem 0.85rem;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: ${({ $active }) => ($active ? "#fff" : "#8f84a8")};
  background: ${({ $active }) => ($active ? "#9b5cff" : "transparent")};
  box-shadow: ${({ $active }) =>
    $active ? "0 8px 22px rgba(124, 58, 237, 0.28)" : "none"};

  &:disabled {
    cursor: not-allowed;
  }
`;
