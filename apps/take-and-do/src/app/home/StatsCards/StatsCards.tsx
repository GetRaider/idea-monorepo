"use client";

import {
  CircleCheckIcon,
  CheckListIcon,
  ClockIcon,
  LightningIcon,
  OverdueIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
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
          <CircleCheckIcon size={24} />
        </StatIcon>
        <StatValue>{stats.total}</StatValue>
        <StatLabel>Total Tasks</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <CheckListIcon size={24} />
        </StatIcon>
        <StatValue>{stats.todo}</StatValue>
        <StatLabel>To Do</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <ClockIcon size={24} />
        </StatIcon>
        <StatValue>{stats.inProgress}</StatValue>
        <StatLabel>In Progress</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <ShieldCheckIcon size={24} />
        </StatIcon>
        <StatValue>{stats.done}</StatValue>
        <StatLabel>Completed</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <LightningIcon size={24} />
        </StatIcon>
        <StatValue>{stats.highPriority}</StatValue>
        <StatLabel>High Priority</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon>
          <OverdueIcon size={24} />
        </StatIcon>
        <StatValue>{stats.overdue}</StatValue>
        <StatLabel>Overdue</StatLabel>
      </StatCard>
    </StatsGrid>
  );
}

export default StatsCards;
