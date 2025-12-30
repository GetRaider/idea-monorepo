"use client";

import styled from "styled-components";
import Link from "next/link";

export const Section = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #fff;
`;

export const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

export const TaskSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

export const TaskStatusBadge = styled.span<{ $status: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
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
`;

export const EmptyState = styled.p`
  color: #888;
  margin-top: 8px;
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

