"use client";

import { useMemo, useState } from "react";

import {
  AppPageTitle,
  HomeMainContent,
  PageContainer,
  WelcomeSection,
} from "@/app/shell.ui";
import { SettingsIcon } from "@/components/Icons";
import { MenuRowButton } from "@/components/MenuRowButton/MenuRowButton";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { env } from "@/env/client";
import {
  APP_CHROME_MAIN_INSET,
  APP_CHROME_NAV_ICON_PX,
  APP_CHROME_PAGE_BLOCK_GAP,
} from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

import { IntegrationsSettings } from "./IntegrationsSettings";

type SettingsSection = "integrations";

export function SettingsPage() {
  const [, setCurrentPage] = useState("settings");
  const [section, setSection] = useState<SettingsSection>("integrations");
  const calendarEnabled = env.features.calendar;

  const content = useMemo(() => {
    if (!calendarEnabled) {
      return (
        <p className="text-sm text-slate-400">
          Integrations are not available in this environment.
        </p>
      );
    }
    if (section === "integrations") return <IntegrationsSettings />;
    return null;
  }, [calendarEnabled, section]);

  return (
    <PageContainer>
      <Sidebar onNavigationChange={setCurrentPage} />
      <HomeMainContent
        withNavSidebar={false}
        className={cn("flex min-h-0 flex-col", APP_CHROME_MAIN_INSET)}
      >
        <WelcomeSection className="flex flex-col gap-2">
          <AppPageTitle
            icon={
              <SettingsIcon
                size={APP_CHROME_NAV_ICON_PX}
                className="shrink-0 text-text-primary"
              />
            }
          >
            Settings
          </AppPageTitle>
        </WelcomeSection>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            APP_CHROME_PAGE_BLOCK_GAP,
            calendarEnabled && "lg:flex-row",
          )}
        >
          {calendarEnabled ? (
            <div className="w-full shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 lg:w-[320px]">
              <MenuRowButton
                rowTransition="colors"
                className={
                  section === "integrations"
                    ? "bg-[#3a3a3a] hover:bg-[#3a3a3a]"
                    : ""
                }
                onClick={() => setSection("integrations")}
              >
                Integrations
              </MenuRowButton>
            </div>
          ) : null}

          <div className="min-h-0 flex-1">{content}</div>
        </div>
      </HomeMainContent>
    </PageContainer>
  );
}
