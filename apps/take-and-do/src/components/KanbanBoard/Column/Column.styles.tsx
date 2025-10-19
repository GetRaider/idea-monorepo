import styled from "styled-components";
import { TaskStatus } from "../KanbanBoard";

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
`;

export const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ColumnTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

export const StatusIcon = styled.span<{ $status?: TaskStatus }>`
  font-size: 16px;
  color: ${(props) => {
    switch (props.$status) {
      case TaskStatus.TODO:
        return "#888";
      case TaskStatus.IN_PROGRESS:
        return "#f59e0b";
      case TaskStatus.DONE:
        return "#10b981";
      default:
        return "#888";
    }
  }};
`;

export const Count = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  background: #2a2a2a;
  border-radius: 10px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
`;

export const ColumnContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #2a2a2a;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #3a3a3a;
  }
`;
