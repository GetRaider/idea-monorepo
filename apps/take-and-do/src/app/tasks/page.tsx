"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import KanbanBoard, {
  TaskSchedule,
} from "@/components/KanbanBoard/KanbanBoard";
import { PageContainer, Main } from "../page.styles";

export default function TasksPage() {
  const [, setCurrentPage] = useState("tasks");
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<TaskSchedule | string>(
    TaskSchedule.TODAY,
  );
  const [workspaceTitle, setWorkspaceTitle] = useState("Today");

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page);
    setIsNavSidebarOpen(true);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);

    if (view === TaskSchedule.TODAY) {
      setWorkspaceTitle("Today");
    } else if (view === TaskSchedule.TOMORROW) {
      setWorkspaceTitle("Tomorrow");
    } else if (view) {
      setWorkspaceTitle(view);
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
        <KanbanBoard currentView={activeView} workspaceTitle={workspaceTitle} />
      </Main>
    </PageContainer>
  );
}
