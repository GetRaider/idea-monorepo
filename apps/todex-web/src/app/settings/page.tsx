"use client";

import { Suspense } from "react";

import { GoogleCalendarSettings } from "./google-calendar-settings";

export default function SettingsPage() {
  return (
    <main className="min-w-0 flex-1 px-6 pb-6 pt-3">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Suspense>
        <GoogleCalendarSettings />
      </Suspense>
    </main>
  );
}
