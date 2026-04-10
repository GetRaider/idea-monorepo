import { RequireSession } from "@/components/Auth/RequireSession";

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
