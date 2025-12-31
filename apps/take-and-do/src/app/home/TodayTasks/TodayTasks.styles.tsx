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
  gap: 8px;
`;

export const TaskItem = styled.div`
  padding: 12px;
  background: #2a2a2a;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #333;
  }
`;

export const TaskContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

export const TaskLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

export const TaskRight = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  font-size: 12px;
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
