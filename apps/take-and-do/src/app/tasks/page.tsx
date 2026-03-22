"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiServices } from "@/services/api";
import {
  LoadingContainer,
  KanbanSpinner,
} from "@/components/Boards/KanbanBoard/KanbanBoard.ui";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

export default function TasksPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const boards = await apiServices.taskBoards.getAll();
        boards.length > 0
          ? router.replace(tasksUrlHelper.routing.buildBoardUrl(boards[0].name))
          : router.replace(tasksUrlHelper.routing.buildScheduleUrl("today"));
      } catch (error) {
        console.error("[TasksPage] Failed to fetch boards:", error);
        router.replace(tasksUrlHelper.routing.buildScheduleUrl("today"));
      }
    };

    redirect();
  }, [router]);

  return (
    <LoadingContainer>
      <KanbanSpinner />
    </LoadingContainer>
  );
}
