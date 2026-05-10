"use client";

import { useMemo, useState } from "react";

import {
  AppPageSubtitle,
  AppPageTitle,
  HomeMainContent,
  PageContainer,
  WelcomeSection,
} from "@/app/shell.ui";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { MenuRowButton } from "@/components/MenuRowButton/MenuRowButton";

import { IntegrationsSettings } from "./IntegrationsSettings";

type SettingsSection = "integrations";

export function SettingsPage() {
  const [, setCurrentPage] = useState("settings");
  const [section, setSection] = useState<SettingsSection>("integrations");

  const content = useMemo(() => {
    if (section === "integrations") return <IntegrationsSettings />;
    return null;
  }, [section]);

  return (
    <PageContainer>
      <Sidebar onNavigationChange={setCurrentPage} />
      <HomeMainContent
        withNavSidebar={false}
        className="flex min-h-0 flex-col px-6 py-6 max-[600px]:px-4 max-[600px]:py-4"
      >
        <WelcomeSection className="mb-6 flex flex-col gap-2 sm:mb-8">
          <AppPageTitle>Settings</AppPageTitle>
          <AppPageSubtitle className="mt-1 max-w-[640px]">
            Manage app preferences and integrations.
          </AppPageSubtitle>
        </WelcomeSection>

        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:gap-6">
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

          <div className="min-h-0 flex-1">{content}</div>
        </div>
      </HomeMainContent>
    </PageContainer>
  );
}
