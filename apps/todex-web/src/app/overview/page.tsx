"use client";

import { useOpenCreateMenu } from "@components/create-menu";
import { NewButton } from "@components/new-button";

import { OVERVIEW_CANVAS_ID } from "./overview-chapters";
import { OverviewSections } from "./overview-sections";

export default function OverviewPage() {
  const openCreateMenu = useOpenCreateMenu();

  return (
    <main
      id={OVERVIEW_CANVAS_ID}
      className="min-h-0 min-w-0 flex-1 overflow-auto px-6 pb-6 pt-3"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <NewButton onClick={openCreateMenu} />
      </div>
      <div className="mt-6 flex w-full min-w-0 flex-col gap-8">
        <OverviewSections />
      </div>
    </main>
  );
}
