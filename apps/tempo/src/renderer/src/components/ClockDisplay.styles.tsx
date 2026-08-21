import styled from "styled-components";

export const ClockWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0 0.35rem;
`;

export const ClockValue = styled.div<{ $overGoal?: boolean }>`
  font-family: "IBM Plex Mono", "SF Mono", ui-monospace, monospace;
  font-size: clamp(2.8rem, 8vw, 4.2rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-align: center;
  color: ${({ $overGoal }) => ($overGoal === true ? "#c4b5fd" : "#f8f4ff")};
  text-shadow: 0 0 36px rgba(155, 92, 255, 0.12);
`;

export const ClockUnits = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 0.35rem 0.75rem;
  min-width: 14rem;
  color: #8f84a8;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  align-items: center;
`;

export const ClockUnitSeparator = styled.span`
  color: rgba(143, 132, 168, 0.55);
  font-size: 0.85rem;
  line-height: 1;
`;

export const ClockCaption = styled.p`
  margin: 0;
  text-align: center;
  color: #8f84a8;
  font-size: 0.8rem;
`;
