"use client";

import { useMemo } from "react";

import type { SidePanelSection } from "@/components/SidePanel/SidePanel.types";
import { useTasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";

import { TasksSidebarSchedulesBody } from "@/components/TasksSidebar/TasksSidebarSchedulesBody";
import { TasksSidebarWorkspacesBody } from "@/components/TasksSidebar/TasksSidebarWorkspacesBody";

import type { TasksSidebarProps } from "@/components/TasksSidebar/tasksSidebar.types";
import { TasksSidebarDeleteDialogs } from "@/components/TasksSidebar/TasksSidebarDeleteDialogs";

export function useTasksSidePanel(props: TasksSidebarProps) {
  const model = useTasksSidebarModel(props);

  const sections = useMemo<SidePanelSection[]>(
    () => [
      {
        id: "schedules",
        title: "Schedules",
        defaultOpen: true,
        body: <TasksSidebarSchedulesBody model={model} />,
      },
      {
        id: "workspaces",
        title: "Workspaces",
        defaultOpen: true,
        grow: true,
        showTopBorder: true,
        actions: props.onCreateTaskBoard
          ? [
              {
                type: "add",
                label: "Create Task Board",
                title: "Create Task Board",
                onClick: props.onCreateTaskBoard,
              },
            ]
          : undefined,
        body: (
          <TasksSidebarWorkspacesBody
            model={model}
            isFoldersLoading={props.isFoldersLoading}
            isBoardsLoading={props.isBoardsLoading}
          />
        ),
      },
    ],
    [model, props],
  );

  return {
    sections,
    dialogs: (
      <TasksSidebarDeleteDialogs
        deletingBoard={model.deletingBoard}
        deletingFolder={model.deletingFolder}
        onCloseBoard={() => model.setDeletingBoard(null)}
        onCloseFolder={() => model.setDeletingFolder(null)}
        onConfirmBoard={model.handleDeleteConfirm}
        onConfirmFolder={model.handleFolderDeleteConfirm}
      />
    ),
  };
}
