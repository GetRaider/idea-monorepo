"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { NavigationSidebar } from "@/components/NavigationSidebar/NavigationSidebar";
import { apiServices } from "@/services/api";
import { PageContainer, Main } from "../page.styles";
import {
  LoadingContainer,
  Spinner,
} from "@/components/KanbanBoard/KanbanBoard.styles";
import {
  buildBoardUrl,
  buildScheduleUrl,
} from "../../helpers/tasks-routing.helper";

export default function TasksPage() {
  const router = useRouter();
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      try {
        const [boards] = await Promise.all([
          apiServices.taskBoards.getAll(),
          apiServices.folders.getAll(),
        ]);
        if (boards.length > 0) {
          router.replace(buildBoardUrl(boards[0].name));
        } else {
          router.replace(buildScheduleUrl("today"));
        }
      } catch (error) {
        console.error("Failed to fetch boards:", error);
        router.replace(buildScheduleUrl("today"));
      }
    };

    redirect();
  }, [router]);

  const handleNavigationChange = () => {
    setIsNavSidebarOpen(true);
  };

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView=""
        taskBoards={[]}
        folders={[]}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </Main>
    </PageContainer>
  );
}
