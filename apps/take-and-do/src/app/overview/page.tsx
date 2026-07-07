"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { StatsCards, ProductivityOverview, TimelinePlanning } from ".";
import { Spinner } from "@/components/Spinner/Spinner";
import { useOverviewPageData } from "@/hooks/overview";

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
  const {
    isLoading,
    taskStats,
    todayTasks,
    tomorrowTasks,
    hasWorkspaceTaskData,
  } = useOverviewPageData();
  const [, setCurrentPage] = useState("overview");

  const handleNavigationToTasksPage = (page: string) => {
    setCurrentPage(page);
  };

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
