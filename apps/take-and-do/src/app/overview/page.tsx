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
import { queryKeys } from "@/lib/query-keys";
import { guestTasksBySchedule } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";
import { toast } from "sonner";

import {
  PageContainer,
  HomeMainContent,
  WelcomeSection,
  AppPageTitle,
} from "../shell.ui";
import { OverviewIcon } from "@/components/Icons";
import { LightningMenu } from "@/components/LightningMenu";
import {
  APP_CHROME_MAIN_INSET,
  APP_CHROME_PAGE_BLOCK_GAP,
  APP_CHROME_PAGE_TITLE_ICON_PX,
  APP_CHROME_TITLE_ACTION_ROW,
} from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

function OverviewPage() {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const [, setCurrentPage] = useState("overview");

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
  };

  const hasWorkspaceTaskData = isAnonymous
    ? guestTasks.length > 0
    : (taskStats?.total ?? 0) > 0;

  if (isLoading) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationToTasksPage} />
        <HomeMainContent
          withNavSidebar={false}
          className={cn("flex min-h-0 flex-col", APP_CHROME_MAIN_INSET)}
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
        withNavSidebar={false}
        className={cn("flex min-h-0 flex-col", APP_CHROME_MAIN_INSET)}
      >
        <WelcomeSection
          className={cn("flex flex-col gap-4", APP_CHROME_TITLE_ACTION_ROW)}
        >
          <AppPageTitle
            icon={
              <OverviewIcon
                size={APP_CHROME_PAGE_TITLE_ICON_PX}
                className="shrink-0 text-text-primary"
              />
            }
          >
            Overview
          </AppPageTitle>
          <LightningMenu className="shrink-0 self-end sm:self-auto" />
        </WelcomeSection>

        <div className={cn("flex min-w-0 flex-col", APP_CHROME_PAGE_BLOCK_GAP)}>
          <ProductivityOverview hasWorkspaceTaskData={hasWorkspaceTaskData} />

          <TimelinePlanning
            todayTasks={todayTasks}
            tomorrowTasks={tomorrowTasks}
            hasWorkspaceTaskData={hasWorkspaceTaskData}
          />

          {taskStats && <StatsCards stats={taskStats} />}
        </div>
      </HomeMainContent>
    </PageContainer>
  );
}

export default OverviewPage;
