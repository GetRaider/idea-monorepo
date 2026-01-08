"use client";

import styled from "styled-components";
import Link from "next/link";

export const Section = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #fff;
`;

export const ScheduleSelect = styled.select`
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
`;

export const DateInputWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const DateInput = styled.input`
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #667eea;
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
`;

export const TaskList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TaskListHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 100px 80px 100px;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 4px;
`;

export const HeaderCell = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const TaskItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 100px 80px 100px;
  gap: 12px;
  padding: 10px 12px;
  background: #2a2a2a;
  border-radius: 6px;
  transition: all 0.2s;
  align-items: center;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: #333;
  }
`;

export const TaskContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const TaskLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

export const TaskCell = styled.div`
  font-size: 13px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TaskCellMuted = styled(TaskCell)`
  color: #666;
`;

export const PriorityIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;
`;

export const TaskSummaryText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StatusIcon = styled.span<{ $status: string }>`
  font-size: 14px;
  color: ${(props) => {
    switch (props.$status) {
      case "To Do":
        return "#888";
      case "In Progress":
        return "#f59e0b";
      case "Done":
        return "#10b981";
      default:
        return "#888";
    }
  }};
`;

export const StatusText = styled.span<{ $status: string }>`
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => {
    switch (props.$status) {
      case "To Do":
        return "#888";
      case "In Progress":
        return "#f59e0b";
      case "Done":
        return "#10b981";
      default:
        return "#888";
    }
  }};
  text-transform: uppercase;
  white-space: nowrap;
`;

export const ViewAllLink = styled(Link)`
  margin-top: 12px;
  display: inline-block;
  color: #667eea;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
