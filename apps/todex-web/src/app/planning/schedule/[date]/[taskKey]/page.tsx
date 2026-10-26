"use client";

import { use } from "react";

import { TasksScheduleView } from "../../../schedule-view";

export default function TasksScheduleTaskPage({
  params,
}: TasksScheduleTaskPageProps) {
  const { date } = use(params);
  return <TasksScheduleView date={date} />;
}

interface TasksScheduleTaskPageProps {
  params: Promise<{ date: string; taskKey: string }>;
}
