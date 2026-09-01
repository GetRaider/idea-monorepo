"use client";

import { TaskEditor } from "./task-editor";
import { TaskList } from "./task-list";
import { TasksModuleSidebar } from "./module-sidebar";
import { TasksProvider } from "./tasks-provider";

export default function TasksPage() {
  return (
    <TasksProvider>
      <div className="flex h-screen">
        <TasksModuleSidebar />
        <TaskList />
        <TaskEditor />
      </div>
    </TasksProvider>
  );
}
