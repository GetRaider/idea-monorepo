"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/Spinner/Spinner";

const SettingsPage = dynamic(
  () =>
    import("@/components/Settings/SettingsPage").then((m) => m.SettingsPage),
  {
    ssr: false,
    loading: () => (
      <div className="app-chrome-bg flex min-h-screen items-center justify-center">
        <Spinner className="min-h-[200px]" />
      </div>
    ),
  },
);

export default function SettingsRoutePage() {
  return <SettingsPage />;
}
