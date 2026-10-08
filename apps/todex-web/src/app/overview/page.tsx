"use client";

import { OVERVIEW_CANVAS_ID } from "./overview-chapters";
import { OverviewSections } from "./overview-sections";

export default function OverviewPage() {
  return (
    <main
      id={OVERVIEW_CANVAS_ID}
      className="min-h-0 min-w-0 flex-1 overflow-auto px-6 pb-6 pt-3"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <div className="mt-6 flex w-full min-w-0 flex-col gap-8">
        <OverviewSections />
      </div>
    </main>
  );
}
