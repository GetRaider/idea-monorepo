"use client";

import {
  CircleCheckIcon,
  CheckListIcon,
  ClockIcon,
  LightningIcon,
  OverdueIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

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

function StatsGrid({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-10 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5",
        className,
      )}
      {...props}
    />
  );
}

function StatCard({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border-app bg-[#1a1a1a] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500",
        className,
      )}
      {...props}
    />
  );
}

function StatIcon({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg bg-input-bg text-indigo-500",
        className,
      )}
      {...props}
    />
  );
}

function StatValue({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("text-[32px] font-bold leading-none text-white", className)}
      {...props}
    />
  );
}

function StatLabel({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("text-sm font-medium text-[#888]", className)}
      {...props}
    />
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
