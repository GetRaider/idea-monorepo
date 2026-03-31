"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Task } from "@/components/Boards/KanbanBoard/types";
import { StatsCards, ProductivityOverview, TimelinePlanning } from ".";
import type { TaskStats } from ".";
import { Spinner } from "@/components/Spinner/Spinner";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { useGuestTasks } from "@/hooks/use-guest-store";
import { useTasksSidebarWidthPx } from "@/hooks/useTasksSidebarWidthPx";
import { guestTasksBySchedule } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services/client";

import {
  PageContainer,
  HomeMainContent,
  WelcomeSection,
  AppPageTitle,
  AppPageSubtitle,
} from "../shell.ui";

function OverviewPage() {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const [, setCurrentPage] = useState("overview");
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
          clientServices.tasks.getBySchedule(),
          clientServices.stats.getByTimeframe("month"),
        ]);

        const guestSchedule = isAnonymous
          ? guestTasksBySchedule(guestTasks)
          : { today: [] as Task[], tomorrow: [] as Task[] };

        setTodayTasks([...scheduledTasks.today, ...guestSchedule.today]);
        setTomorrowTasks([
          ...scheduledTasks.tomorrow,
          ...guestSchedule.tomorrow,
        ]);
        setTaskStats(dashboardStatsResponse);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [isAnonymous, guestTasks]);

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
          <AppPageTitle>Overview</AppPageTitle>
          <AppPageSubtitle>
            Supercharge your workflow with AI insights & modern planning
          </AppPageSubtitle>
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

export default OverviewPage;
