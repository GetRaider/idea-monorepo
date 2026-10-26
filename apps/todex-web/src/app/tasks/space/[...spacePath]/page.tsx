"use client";

import { use } from "react";
import { notFound } from "next/navigation";

import { Spinner } from "@repo/ui";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { TaskList } from "../../task-list";
import { useTasks } from "../../tasks-provider";

export default function TasksSpacePage({ params }: TasksSpacePageProps) {
  const { spacePath } = use(params);
  const parsed = tasksUrlHelper.routing.parseSpacePath(spacePath);
  const {
    state: { selectedBoard, view },
    meta: { isLoading },
  } = useTasks();

  if (!parsed) notFound();

  if (isLoading) {
    return <Spinner className="flex-1" />;
  }

  if (!selectedBoard || view.kind !== "board") {
    return (
      <p className="px-6 py-10 text-sm text-muted-foreground">
        Space &quot;{parsed.spaceName}&quot; not found.
      </p>
    );
  }

  return <TaskList />;
}

interface TasksSpacePageProps {
  params: Promise<{ spacePath: string[] }>;
}
