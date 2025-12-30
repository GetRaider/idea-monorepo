"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import { tasksService } from "@/services/api/tasks.service";
import { Task } from "@/components/KanbanBoard/types";
import {
  StatsCards,
  StatisticsOverview,
  SummarySection,
  TodayTasks,
  QuickActions,
} from ".";
import type { TaskStats, AnalyticsData, Timeframe } from ".";
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
  const [, setTomorrowTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isGeneratingAnalytics, setIsGeneratingAnalytics] = useState(false);
  const [summaryTimeframe, setSummaryTimeframe] = useState<Timeframe>("month");

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

  const handleGenerateAnalytics = async (useAI: boolean) => {
    try {
      setIsGeneratingAnalytics(true);

      const statsResponse = await fetch(
        `/api/analytics?timeframe=${summaryTimeframe}`,
      );
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const { stats: fetchedStats } = await statsResponse.json();

      const analyticsResponse = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: fetchedStats,
          timeframe: summaryTimeframe,
          shouldUseAI: useAI,
        }),
      });

      if (!analyticsResponse.ok) {
        throw new Error("Failed to generate analytics");
      }

      const data = await analyticsResponse.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Failed to generate analytics:", error);
    } finally {
      setIsGeneratingAnalytics(false);
    }
  };

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

        <TwoColumnGrid>
          <SummarySection
            analytics={analytics}
            timeframe={summaryTimeframe}
            onTimeframeChange={setSummaryTimeframe}
            onGenerateAnalytics={handleGenerateAnalytics}
            isGenerating={isGeneratingAnalytics}
          />
          <TodayTasks tasks={todayTasks} />
        </TwoColumnGrid>

        <StatisticsOverview />

        {taskStats && <StatsCards stats={taskStats} />}

        <QuickActions />
      </MainContent>
    </PageContainer>
  );
}

export default HomePage;
