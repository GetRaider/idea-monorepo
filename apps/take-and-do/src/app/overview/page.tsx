"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Task } from "@/components/Boards/KanbanBoard/types";
import { StatsCards, ProductivityOverview, TimelinePlanning } from ".";
import type { TaskStats } from ".";
import { Spinner } from "@/components/Spinner/Spinner";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import { useTasksSidebarWidthPx } from "@/hooks/tasks/useTasksSidebarWidthPx";
import { queryKeys } from "@/lib/query-keys";
import { guestTasksBySchedule } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";
import { toast } from "sonner";

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

  const scheduledAndStats = useQueries({
    queries: [
      {
        queryKey: queryKeys.tasks.schedule,
        queryFn: () => clientServices.tasks.getBySchedule(),
        enabled: !isAnonymous,
      },
      {
        queryKey: queryKeys.stats("month"),
        queryFn: () => clientServices.stats.getByTimeframe("month"),
        enabled: !isAnonymous,
      },
    ],
  });

  const [scheduledQuery, statsQuery] = scheduledAndStats;
  const isLoading =
    !isAnonymous && (scheduledQuery.isPending || statsQuery.isPending);

  const scheduledTasks =
    !isAnonymous && scheduledQuery.data
      ? scheduledQuery.data
      : { today: [] as Task[], tomorrow: [] as Task[] };
  const taskStats: TaskStats | null =
    !isAnonymous && statsQuery.data !== undefined ? statsQuery.data : null;

  const guestSchedule = isAnonymous
    ? guestTasksBySchedule(guestTasks)
    : { today: [] as Task[], tomorrow: [] as Task[] };

  const todayTasks = [
    ...scheduledTasks.today,
    ...(isAnonymous ? guestSchedule.today : []),
  ];
  const tomorrowTasks = [
    ...scheduledTasks.tomorrow,
    ...(isAnonymous ? guestSchedule.tomorrow : []),
  ];

  const statsToastShown = useRef(false);
  useEffect(() => {
    if (
      isAnonymous ||
      !statsQuery.isSuccess ||
      statsQuery.data !== null ||
      statsQuery.isFetching
    ) {
      return;
    }
    if (statsToastShown.current) return;
    statsToastShown.current = true;
    toast.error("Can't load dashboard stats");
  }, [
    isAnonymous,
    statsQuery.data,
    statsQuery.isSuccess,
    statsQuery.isFetching,
  ]);

  const handleNavigationToTasksPage = (page: string) => {
    setCurrentPage(page);
    if (page === "tasks") {
      setIsTasksSidebarOpen(true);
    }
  };

  const hasWorkspaceTaskData = isAnonymous
    ? guestTasks.length > 0
    : (taskStats?.total ?? 0) > 0;

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

        <ProductivityOverview hasWorkspaceTaskData={hasWorkspaceTaskData} />

        <TimelinePlanning
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
          hasWorkspaceTaskData={hasWorkspaceTaskData}
        />

        {taskStats && <StatsCards stats={taskStats} />}
      </HomeMainContent>
    </PageContainer>
  );
}

export default OverviewPage;
