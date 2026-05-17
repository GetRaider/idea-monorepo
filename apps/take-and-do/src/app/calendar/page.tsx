"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/Spinner/Spinner";

const CalendarPage = dynamic(
  () => import("@/components/Calendar").then((m) => m.CalendarPage),
  {
    ssr: false,
    loading: () => (
      <div className="app-chrome-bg flex min-h-screen items-center justify-center">
        <Spinner className="min-h-[200px]" />
      </div>
    ),
  },
);

export default function CalendarRoutePage() {
  return <CalendarPage />;
}
