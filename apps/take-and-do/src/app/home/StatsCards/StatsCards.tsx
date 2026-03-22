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
} from "./StatsCards.ui";

export function StatsCards({ stats }: StatsCardsProps) {
  const statMap = {
    total: {
      icon: <CircleCheckIcon />,
      label: "Total Tasks",
    },
    todo: {
      icon: <CheckListIcon />,
      label: "To Do",
    },
    inProgress: {
      icon: <ClockIcon />,
      label: "In Progress",
    },
    done: {
      icon: <ShieldCheckIcon />,
      label: "Completed",
    },
    highPriority: {
      icon: <LightningIcon />,
      label: "High Priority",
    },
    overdue: {
      icon: <OverdueIcon />,
      label: "Overdue",
    },
  };
  return (
    <StatsGrid>
      {Object.entries(statMap).map(([statName, stat]) => (
        <StatCard key={statName}>
          <StatIcon>{stat.icon}</StatIcon>
          <StatValue>{stats[statName as keyof TaskStats]}</StatValue>
          <StatLabel>{stat.label}</StatLabel>
        </StatCard>
      ))}
    </StatsGrid>
  );
}

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

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
  overdue: number;
}
