"use client";

import { useState } from "react";

import {
  AppPageTitle,
  HomeMainContent,
  PageContainer,
  WelcomeSection,
} from "@/app/shell.ui";
import {
  FocusAnalyticsSection,
  FocusHistory,
  FocusSessionPanel,
} from "@/components/Focus";
import { LightningIcon } from "@/components/Icons/LightningIcon";
import { LightningMenu } from "@/components/LightningMenu";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import {
  APP_CHROME_MAIN_INSET,
  APP_CHROME_NAV_ICON_PX,
  APP_CHROME_PAGE_BLOCK_GAP,
  APP_CHROME_TITLE_ACTION_ROW,
} from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

function FocusPage() {
  const [, setCurrentPage] = useState("focus");

  return (
    <PageContainer>
      <Sidebar onNavigationChange={setCurrentPage} />
      <HomeMainContent
        withNavSidebar={false}
        className={cn("flex min-h-0 flex-col", APP_CHROME_MAIN_INSET)}
      >
        <WelcomeSection
          className={cn("flex flex-col gap-4", APP_CHROME_TITLE_ACTION_ROW)}
        >
          <AppPageTitle
            icon={
              <LightningIcon
                size={APP_CHROME_NAV_ICON_PX}
                className="shrink-0 text-text-primary"
              />
            }
          >
            Focus
          </AppPageTitle>
          <LightningMenu className="shrink-0 self-end sm:self-auto" />
        </WelcomeSection>

        <div
          className={cn(
            "flex w-full min-w-0 flex-1 flex-col",
            APP_CHROME_PAGE_BLOCK_GAP,
          )}
        >
          <FocusSessionPanel />
          <FocusAnalyticsSection />
          <FocusHistory />
        </div>
      </HomeMainContent>
    </PageContainer>
  );
}

export default FocusPage;
