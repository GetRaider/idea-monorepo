import styled from "styled-components";

import { colors } from "../App.styles";

export const SettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 28rem;
`;

export const SettingsGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const SettingsGroupTitle = styled.h2`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.muted};
`;

export const RangeField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: ${colors.muted};
`;

export const RangeInput = styled.input`
  accent-color: ${colors.purple};
`;

export const DataActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  > button {
    flex: 1;
    min-width: 7rem;
  }
`;
