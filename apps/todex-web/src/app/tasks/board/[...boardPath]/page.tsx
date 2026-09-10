"use client";

import { use } from "react";
import { notFound } from "next/navigation";

import { Spinner } from "@repo/ui";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { TaskList } from "../../task-list";
import { useTasks } from "../../tasks-provider";

export default function TasksBoardPage({ params }: TasksBoardPageProps) {
  const { boardPath } = use(params);
  const parsed = tasksUrlHelper.routing.parseBoardPath(boardPath);
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
        Board &quot;{parsed.boardName}&quot; not found.
      </p>
    );
  }

  return <TaskList />;
}

interface TasksBoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}
