"use client";

import styled from "styled-components";
import { LoadingContainer as BaseLoadingContainer } from "@/components/Boards/KanbanBoard/KanbanBoard.styles";

export const BoardLoadingWrapper = styled(BaseLoadingContainer)`
  flex-direction: column;
  gap: 12px;
`;

export const BoardLoadingLabel = styled.span`
  font-size: 14px;
  color: #888;
`;
