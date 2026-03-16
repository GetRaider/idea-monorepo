"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiServices } from "@/services/api";
import {
  LoadingContainer,
  Spinner,
} from "@/components/Boards/KanbanBoard/KanbanBoard.styles";
import {
  buildBoardUrl,
  buildScheduleUrl,
} from "../../helpers/tasks-routing.helper";

export default function TasksPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const [boards] = await Promise.all([
          apiServices.taskBoards.getAll(),
          apiServices.folders.getAll(),
        ]);
        boards.length > 0
          ? router.replace(buildBoardUrl(boards[0].name))
          : router.replace(buildScheduleUrl("today"));
      } catch (error) {
        console.error("[TasksPage] Failed to fetch boards:", error);
        router.replace(buildScheduleUrl("today"));
      }
    };

    redirect();
  }, [router]);

  return (
    <LoadingContainer>
      <Spinner />
    </LoadingContainer>
  );
}
