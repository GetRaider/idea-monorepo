import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/RequireSession";

export const metadata: Metadata = {
  title: "Tasks",
};

import TasksLayoutClient from "./TasksLayout";

export default async function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireSession>
      <TasksLayoutClient>{children}</TasksLayoutClient>
    </RequireSession>
  );
}
