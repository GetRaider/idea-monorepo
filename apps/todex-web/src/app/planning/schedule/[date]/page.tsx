"use client";

import { use } from "react";

import { TasksScheduleView } from "../../schedule-view";

export default function TasksSchedulePage({ params }: TasksSchedulePageProps) {
  const { date } = use(params);
  return <TasksScheduleView date={date} />;
}

interface TasksSchedulePageProps {
  params: Promise<{ date: string }>;
}
