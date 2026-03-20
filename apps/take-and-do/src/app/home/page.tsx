"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { apiServices } from "@/services/api";
import { Task } from "@/components/Boards/KanbanBoard/types";
import { StatsCards, ProductivityOverview, TimelinePlanning } from ".";
import type { TaskStats } from ".";
import {
  PageContainer,
  MainContent,
  WelcomeSection,
  Title,
  Subtitle,
  LoadingContainer,
  Spinner,
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
          apiServices.tasks.getBySchedule(),
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
      <MainContent $withNavSidebar={isNavSidebarOpen}>
        <WelcomeSection>
          <Title>Home</Title>
          <Subtitle>
            Supercharge your workflow with AI insights & modern planning
          </Subtitle>
        </WelcomeSection>

        <ProductivityOverview />

        <TimelinePlanning
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
        />

        {taskStats && <StatsCards stats={taskStats} />}
      </MainContent>
    </PageContainer>
  );
}

export default HomePage;
