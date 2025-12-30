"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import { tasksService } from "@/services/api/tasks.service";
import { Task } from "@/components/KanbanBoard/types";
import {
  StatsCards,
  StatisticsOverview,
  ScheduledTasks,
  QuickActions,
} from ".";
import type { TaskStats } from ".";
import {
  PageContainer,
  MainContent,
  WelcomeSection,
  Title,
  Subtitle,
  LoadingContainer,
  Spinner,
  TwoColumnGrid,
} from "./page.styles";

function HomePage() {
  const [, setCurrentPage] = useState("home");
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [scheduledTasks, dashboardStatsResponse] = await Promise.all([
          tasksService.getBySchedule(),
          fetch(`/api/stats?timeframe=month`).then((res) =>
            res.ok ? res.json() : null,
          ),
        ]);

        setTodayTasks(scheduledTasks.today);
        setTomorrowTasks(scheduledTasks.tomorrow);
        if (dashboardStatsResponse) {
          setTaskStats(dashboardStatsResponse);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page);
    if (page === "tasks") {
      setIsNavSidebarOpen(true);
    }
  };

  const handleViewChange = (view: string) => {
    if (view === "today" || view === "tomorrow") {
      window.location.href = "/tasks";
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <MainContent $withNavSidebar={isNavSidebarOpen}>
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView="today"
        onViewChange={handleViewChange}
      />
      <MainContent $withNavSidebar={isNavSidebarOpen}>
        <WelcomeSection>
          <Title>Welcome back!</Title>
          <Subtitle>Here&apos;s an overview of your workspace</Subtitle>
        </WelcomeSection>

        <ScheduledTasks todayTasks={todayTasks} tomorrowTasks={tomorrowTasks} />

        <StatisticsOverview />

        {taskStats && <StatsCards stats={taskStats} />}

        <QuickActions />
      </MainContent>
    </PageContainer>
  );
}

export default HomePage;
