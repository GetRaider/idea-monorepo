"use client";

import { useMemo, use } from "react";
import { notFound } from "next/navigation";
import { MultipleKanbanBoard } from "@/components/Boards/KanbanBoard/MultipleKanbanBoard";
import { Task } from "@/components/Boards/KanbanBoard/types";
import {
  isValidScheduleDate,
  buildScheduleUrl,
  ScheduleDate,
} from "../../../../helpers/tasks-routing.helper";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface SchedulePageProps {
  params: Promise<{ date: string }>;
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { date } = use(params);
  const { taskBoards } = useWorkspace();

  if (!isValidScheduleDate(date)) {
    notFound();
  }

  const taskBoardNameMap = useMemo(
    () =>
      taskBoards.reduce<Record<string, string>>((acc, board) => {
        acc[board.id] = board.name;
        return acc;
      }, {}),
    [taskBoards],
  );

  const handleTaskOpen = (task: Task) => {
    if (task.taskKey) {
      const newUrl = `/tasks/schedule/${date}/${task.taskKey}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const handleTaskClose = () => {
    window.history.replaceState(null, "", buildScheduleUrl(date));
  };

  const handleSubtaskOpen = (parentTask: Task, subtask: Task) => {
    if (parentTask.taskKey && subtask.taskKey) {
      const newUrl = `/tasks/schedule/${date}/${parentTask.taskKey}/${subtask.taskKey}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  return (
    <MultipleKanbanBoard
      scheduleDate={getScheduleDate(date)}
      workspaceTitle={getScheduleTitle(date)}
      taskBoardNameMap={taskBoardNameMap}
      onTaskOpen={handleTaskOpen}
      onTaskClose={handleTaskClose}
      onSubtaskOpen={handleSubtaskOpen}
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
