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

export const TaskList = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.$compact ? "6px" : "8px")};
`;

export const TaskItem = styled.div<{ $compact?: boolean }>`
  padding: ${(props) => (props.$compact ? "8px 10px" : "10px 12px")};
  background: #2a2a2a;
  border-radius: ${(props) => (props.$compact ? "6px" : "8px")};
  transition: all 0.2s;

  &:hover {
    background: #333;
  }
`;

export const TaskSummary = styled.div<{ $compact?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${(props) => (props.$compact ? "8px" : "12px")};
`;

export const TaskSummaryText = styled.span<{ $compact?: boolean }>`
  font-size: ${(props) => (props.$compact ? "13px" : "14px")};
  font-weight: ${(props) => (props.$compact ? "500" : "600")};
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TaskStatusBadge = styled.span<{
  $status: string;
  $compact?: boolean;
}>`
  padding: ${(props) => (props.$compact ? "2px 8px" : "4px 12px")};
  border-radius: ${(props) => (props.$compact ? "10px" : "12px")};
  font-size: ${(props) => (props.$compact ? "10px" : "12px")};
  font-weight: 600;
  text-transform: uppercase;
  background: ${(props) => {
    switch (props.$status) {
      case "To Do":
        return "#3b82f6";
      case "In Progress":
        return "#f59e0b";
      case "Done":
        return "#10b981";
      default:
        return "#6b7280";
    }
  }};
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
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
