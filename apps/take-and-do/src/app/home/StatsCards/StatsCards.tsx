"use client";

import {
  StatsGrid,
  StatCard,
  StatIcon,
  StatValue,
  StatLabel,
} from "./StatsCards.styles";

interface StatsCardsProps {
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    highPriority: number;
    overdue: number;
  };
}

function StatsCards({ stats }: StatsCardsProps) {
  return (
    <StatsGrid>
      <StatCard>
        <StatIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </StatIcon>
        <StatValue>{stats.total}</StatValue>
        <StatLabel>Total Tasks</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </StatIcon>
        <StatValue>{stats.todo}</StatValue>
        <StatLabel>To Do</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 6v6l4 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </StatIcon>
        <StatValue>{stats.inProgress}</StatValue>
        <StatLabel>In Progress</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </StatIcon>
        <StatValue>{stats.done}</StatValue>
        <StatLabel>Completed</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 10V3L4 14h7v7l9-11h-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </StatIcon>
        <StatValue>{stats.highPriority}</StatValue>
        <StatLabel>High Priority</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 6v6l4 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8 12h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </StatIcon>
        <StatValue>{stats.overdue}</StatValue>
        <StatLabel>Overdue</StatLabel>
      </StatCard>
    </StatsGrid>
  );
}

export default StatsCards;

