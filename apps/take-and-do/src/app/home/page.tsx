"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Task } from "@/components/Boards/KanbanBoard/types";
import { StatsCards, ProductivityOverview, TimelinePlanning } from ".";
import type { TaskStats } from ".";
import { Spinner } from "@/components/Spinner/Spinner";
import { useTasksSidebarWidthPx } from "@/hooks/useTasksSidebarWidthPx";
import { apiServices } from "@/services/api";

import {
  PageContainer,
  HomeMainContent,
  WelcomeSection,
  HomePageTitle,
  HomePageSubtitle,
} from "../shell.ui";

function HomePage() {
  const [, setCurrentPage] = useState("home");
  const [isTasksSidebarOpen, setIsTasksSidebarOpen] = useState(false);
  const [tasksSidebarWidthPx] = useTasksSidebarWidthPx();
  const [isLoading, setIsLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [scheduledTasks, dashboardStatsResponse] = await Promise.all([
          apiServices.tasks.getBySchedule(),
          apiServices.stats.getByTimeframe("month"),
        ]);

        setTodayTasks(scheduledTasks.today);
        setTomorrowTasks(scheduledTasks.tomorrow);
        setTaskStats(dashboardStatsResponse);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigationToTasksPage = (page: string) => {
    setCurrentPage(page);
    if (page === "tasks") {
      setIsTasksSidebarOpen(true);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationToTasksPage} />
        <HomeMainContent
          withNavSidebar={isTasksSidebarOpen}
          tasksSidebarWidthPx={tasksSidebarWidthPx}
        >
          <Spinner className="h-full min-h-[240px] flex-1" />
        </HomeMainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationToTasksPage} />
      <HomeMainContent
        withNavSidebar={isTasksSidebarOpen}
        tasksSidebarWidthPx={tasksSidebarWidthPx}
      >
        <WelcomeSection>
          <HomePageTitle>Home</HomePageTitle>
          <HomePageSubtitle>
            Supercharge your workflow with AI insights & modern planning
          </HomePageSubtitle>
        </WelcomeSection>

        <ProductivityOverview />

        <TimelinePlanning
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
        />

        {taskStats && <StatsCards stats={taskStats} />}
      </HomeMainContent>
    </PageContainer>
  );
}

export default HomePage;
