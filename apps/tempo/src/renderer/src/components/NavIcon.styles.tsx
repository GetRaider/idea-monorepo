import styled from "styled-components";

import { colors } from "../App.styles";

export const NavIconSvg = styled.svg<{ $active: boolean }>`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: ${({ $active }) => ($active ? colors.purple : colors.muted)};
`;
