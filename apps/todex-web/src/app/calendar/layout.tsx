"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CanvasColumn } from "@components/CanvasColumn";
import { ModuleSurface } from "@components/module-surface";
import { useCalendarEnabled } from "../settings/use-calendar-enabled";

import { CalendarEventView } from "./calendar-event-view";
import { CalendarTaskView } from "./calendar-task-view";
import { CalendarProvider } from "./calendar-provider";
import { CalendarSidebar } from "./calendar-sidebar";

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <CalendarModuleGuard>
        <CalendarProvider>
          <ModuleSurface>
            <CalendarSidebar />
            <CanvasColumn>
              <div className="flex min-h-0 min-w-0 flex-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
                <CalendarEventView />
                <CalendarTaskView />
              </div>
            </CanvasColumn>
          </ModuleSurface>
        </CalendarProvider>
      </CalendarModuleGuard>
    </Suspense>
  );
}

function CalendarModuleGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { enabled, isPending } = useCalendarEnabled();
  const blocked = pathname === "/calendar" && (isPending || !enabled);

  useEffect(() => {
    if (pathname !== "/calendar" || isPending || enabled) return;
    router.replace("/overview");
  }, [enabled, isPending, pathname, router]);

  if (blocked) return null;
  return children;
}
