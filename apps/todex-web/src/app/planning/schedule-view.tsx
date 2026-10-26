"use client";

import { notFound } from "next/navigation";

import { Spinner } from "@repo/ui";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { TaskList } from "./task-list";
import { useTasks } from "./tasks-provider";

export function TasksScheduleView({ date }: { date: string }) {
  const {
    meta: { isLoading, isTasksLoading },
  } = useTasks();

  if (!tasksUrlHelper.routing.isValidScheduleDate(date)) {
    notFound();
  }

  if (isLoading || isTasksLoading) {
    return <Spinner className="flex-1" />;
  }

  return <TaskList />;
}
