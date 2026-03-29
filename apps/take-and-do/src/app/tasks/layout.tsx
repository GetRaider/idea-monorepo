import { RequireSession } from "@/components/auth/RequireSession";

import TasksLayoutClient from "./TasksLayout.client";

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
