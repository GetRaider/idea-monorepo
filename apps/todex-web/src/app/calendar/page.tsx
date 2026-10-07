"use client";

import dynamic from "next/dynamic";

const CalendarGrid = dynamic(
  () => import("./calendar-grid").then((module) => module.CalendarGrid),
  { ssr: false },
);

export default function CalendarPage() {
  return <CalendarGrid />;
}
