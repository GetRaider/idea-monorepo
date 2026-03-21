"use client";

import { use } from "react";
import { notFound } from "next/navigation";

import { MultipleKanbanBoard } from "@/components/Boards/KanbanBoard/MultipleKanbanBoard";
import { useScheduleTaskUrlSync } from "@/hooks/useKanbanTaskUrlSync";
import {
  isValidScheduleDate,
  type ScheduleDate,
} from "@/helpers/tasks-routing.helper";

interface SchedulePageProps {
  params: Promise<{ date: string }>;
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { date } = use(params);
  const scheduleDate: ScheduleDate = isValidScheduleDate(date)
    ? date
    : "today";

  const { onTaskOpen, onTaskClose, onSubtaskOpen } =
    useScheduleTaskUrlSync(scheduleDate);

  if (!isValidScheduleDate(date)) {
    notFound();
  }

  return (
    <MultipleKanbanBoard
      scheduleDate={getScheduleDate(scheduleDate)}
      workspaceName={getScheduleTitle(scheduleDate)}
      onTaskOpen={onTaskOpen}
      onTaskClose={onTaskClose}
      onSubtaskOpen={onSubtaskOpen}
    />
  );
}

function getScheduleDate(date: ScheduleDate): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (date === "tomorrow") {
    now.setDate(now.getDate() + 1);
  }
  return now;
}

function getScheduleTitle(date: ScheduleDate): string {
  return date === "today" ? "Today" : "Tomorrow";
}
