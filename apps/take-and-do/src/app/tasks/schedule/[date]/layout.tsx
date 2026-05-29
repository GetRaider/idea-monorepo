import type { Metadata } from "next";
import type { ReactNode } from "react";

import { tasksUrlHelper, type ScheduleDate } from "@/helpers/tasks-url.helper";

export async function generateMetadata({
  params,
}: ScheduleRouteLayoutProps): Promise<Metadata> {
  const { date } = await params;

  return {
    title: tasksUrlHelper.routing.isValidScheduleDate(date)
      ? getScheduleTitle(date)
      : "Schedule",
  };
}

export default function ScheduleRouteLayout({
  children,
}: ScheduleRouteLayoutProps) {
  return children;
}

function getScheduleTitle(date: ScheduleDate): string {
  return date === "today" ? "Today" : "Tomorrow";
}

interface ScheduleRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ date: string }>;
}
