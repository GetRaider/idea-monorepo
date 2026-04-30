"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/Spinner/Spinner";

const CalendarPage = dynamic(
  () =>
    import("@/components/Calendar/CalendarPage").then((m) => m.CalendarPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#3c2856]">
        <Spinner className="min-h-[200px]" />
      </div>
    ),
  },
);

export default function CalendarRoutePage() {
  return <CalendarPage />;
}
