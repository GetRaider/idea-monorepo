"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import KanbanBoard from "@/components/KanbanBoard/KanbanBoard";
import { taskBoardsService } from "@/services/api/taskBoards.service";
import { PageContainer, Main } from "../page.styles";

export default function TasksPage() {
  const [currentPage, setCurrentPage] = useState("tasks");
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("today");
  const [workspaceTitle, setWorkspaceTitle] = useState("Today");

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page);
    setIsNavSidebarOpen(true);
  };

  const handleViewChange = async (boardView: string) => {
    setActiveView(boardView);

    console.log({ boardView });

    if (boardView === "today") {
      setWorkspaceTitle("Today");
    } else if (boardView === "tomorrow") {
      setWorkspaceTitle("Tomorrow");
    } else if (boardView) {
      setWorkspaceTitle(boardView);
    }
  };

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView={activeView}
        onViewChange={handleViewChange}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <KanbanBoard boardView={activeView} workspaceTitle={workspaceTitle} />
      </Main>
    </PageContainer>
  );
}
