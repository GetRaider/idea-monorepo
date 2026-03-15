import styled from "styled-components";
import { TaskStatus } from "../types";

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
  margin: 0;
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

export const ColumnContent = styled.div<{
  $isDragOver?: boolean;
  $isEmpty?: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
  flex: 1;
  position: relative;
  background-color: ${(props) =>
    props.$isDragOver ? "rgba(245, 158, 11, 0.1)" : "transparent"};
  border-radius: ${(props) => (props.$isDragOver ? "8px" : "0")};
  transition: background-color 0.2s;
  min-height: ${(props) => (props.$isEmpty ? "100px" : "auto")};

  & > * {
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

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

  @keyframes taskDropIn {
    0% {
      opacity: 0;
      transform: scale(0.97) translateY(-5px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

export const EmptyColumnTopIndicator = styled.div`
  height: 4px;
  background: #f59e0b;
  border-radius: 2px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
`;

export const EmptyColumnPlaceholder = styled.div<{ $isDragOver?: boolean }>`
  background: transparent;
  border: ${(props) =>
    props.$isDragOver
      ? "2px dashed rgba(245, 158, 11, 0.5)"
      : "1px dashed rgba(42, 42, 42, 0.5)"};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: ${(props) =>
    props.$isDragOver ? "#f59e0b" : "rgba(102, 102, 102, 0.5)"};
  font-size: 14px;
  opacity: ${(props) => (props.$isDragOver ? 1 : 0.3)};
`;

export const DropIndicator = styled.div`
  height: 2px;
  background: #f59e0b;
  border-radius: 1px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
`;

export const DropIndicatorBetween = styled.div`
  height: 2px;
  background: #f59e0b;
  border-radius: 1px;
  margin-bottom: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
`;

export const DropIndicatorEnd = styled.div`
  height: 2px;
  background: #f59e0b;
  border-radius: 1px;
  margin-top: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
`;

export const TaskWrapper = styled.div<{ $isDropped?: boolean }>`
  position: relative;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
  animation: ${(props) =>
    props.$isDropped ? "taskDropIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)" : "none"};
`;
