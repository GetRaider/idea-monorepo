"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import KanbanBoard from "@/components/KanbanBoard/KanbanBoard";
import { PageContainer, Main } from "./page.styles";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("tasks");
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page);
    setIsNavSidebarOpen(true);
  };

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar isOpen={isNavSidebarOpen} />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <KanbanBoard />
      </Main>
    </PageContainer>
  );
}
