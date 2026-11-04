"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCalendarEnabled } from "../../settings/use-calendar-enabled";
import { CalendarEventView } from "../../calendar/calendar-event-view";
import { CalendarSchedulePanel } from "../../calendar/calendar-schedule-panel";
import { CalendarTaskView } from "../../calendar/calendar-task-view";
import { CalendarProvider, useCalendar } from "../../calendar/calendar-provider";

export default function PlanningCalendarLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense>
      <CalendarModuleGuard>
        <CalendarProvider>
          <div className="flex min-h-0 min-w-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            <CalendarSideSlot />
          </div>
        </CalendarProvider>
      </CalendarModuleGuard>
    </Suspense>
  );
}

function CalendarSideSlot() {
  const {
    state: { composer, selectedEvent, selectedTaskId, scheduleOpen },
  } = useCalendar();
  if (composer || selectedEvent) return <CalendarEventView />;
  if (selectedTaskId) return <CalendarTaskView />;
  if (scheduleOpen) return <CalendarSchedulePanel />;
  return null;
}

function CalendarModuleGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { enabled, isPending } = useCalendarEnabled();
  const blocked =
    pathname === "/planning/calendar" && (isPending || !enabled);

  useEffect(() => {
    if (pathname !== "/planning/calendar" || isPending || enabled) return;
    router.replace("/overview");
  }, [enabled, isPending, pathname, router]);

  if (blocked) return null;
  return children;
}
