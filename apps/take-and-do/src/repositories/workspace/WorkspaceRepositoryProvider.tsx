"use client";

import { createContext, useContext, type ReactNode } from "react";

import type {
  WorkspaceRepository,
  WorkspaceTaskFilter,
} from "./workspace-repository.types";
import { useWorkspaceRepositoryValue } from "./use-workspace-repository-value";
import { useWorkspaceTasksFilter } from "./use-workspace-tasks-filter";

export function WorkspaceRepositoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useWorkspaceRepositoryValue();
  return (
    <WorkspaceRepositoryContext.Provider value={value}>
      {children}
    </WorkspaceRepositoryContext.Provider>
  );
}

export function useWorkspaceRepository(
  taskFilter?: WorkspaceTaskFilter,
): WorkspaceRepository {
  const context = useContext(WorkspaceRepositoryContext);
  if (!context) {
    throw new Error(
      "useWorkspaceRepository must be used within WorkspaceRepositoryProvider",
    );
  }

  const filteredTasks = useWorkspaceTasksFilter(
    context.useLocalWorkspace,
    context.tasks,
    taskFilter,
  );

  if (!filteredTasks) return context;

  return {
    ...context,
    tasks: filteredTasks.tasks,
    isTasksLoading: filteredTasks.isTasksLoading,
  };
}

const WorkspaceRepositoryContext = createContext<WorkspaceRepository | null>(
  null,
);
