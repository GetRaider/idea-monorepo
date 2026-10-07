"use client";

import { Suspense, type ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

import { CalendarEventView } from "./calendar-event-view";
import { CalendarTaskView } from "./calendar-task-view";
import { CalendarProvider } from "./calendar-provider";
import { CalendarSidebar } from "./calendar-sidebar";

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <CalendarProvider>
        <div className="my-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
          <CalendarSidebar />
          <CanvasColumn>
            <div className="flex min-h-0 min-w-0 flex-1">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
              <CalendarEventView />
              <CalendarTaskView />
            </div>
          </CanvasColumn>
        </div>
      </CalendarProvider>
    </Suspense>
  );
}
