"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TasksSidebar } from "@/components/TasksSidebar/TasksSidebar";
import { CreateWorkspaceDialog } from "@/components/TasksSidebar/Workspaces/CreateWorkspace/CreateWorkspaceDialog";
import { PageContainer, TasksLayoutMain as Main } from "../shell.ui";
import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { waiterHelper } from "@/helpers/waiter.helper";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { useTasksSidebarWidthPx } from "@/hooks/useTasksSidebarWidthPx";
import { clientServices } from "@/services/client";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAnonymous = useIsAnonymous();
  const {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    setFolders,
    setTaskBoards,
  } = useWorkspaces();

  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [tasksSidebarWidthPx, setTasksSidebarWidthPx] =
    useTasksSidebarWidthPx();
  const [isWorkspaceCreateDialogOpen, setIsWorkspaceCreateDialogOpen] =
    useState(false);

  const activeView = tasksUrlHelper.routing.getActiveViewFromPathname(
    pathname ?? "",
  );

  const handleViewChange = (view: string) => {
    if (view === "today" || view === "tomorrow") {
      router.push(tasksUrlHelper.routing.buildScheduleUrl(view));
      return;
    }
    if (view === TASKS_ROOT_VIEW_ID) {
      router.push(tasksUrlHelper.routing.buildRootUrl());
      return;
    }
    router.push(tasksUrlHelper.routing.buildBoardUrl(view));
  };

  const handleNavigationChange = () => setIsNavSidebarOpen(true);

  const handleCreateFolder = async (
    name: string,
    boardIdsToMove: string[] = [],
    emoji?: string | null,
  ) => {
    try {
      const folder = await clientServices.folders.create({ name, emoji });
      if (!isAnonymous) {
        setFolders((previous) => [...previous, folder]);
      }

      if (boardIdsToMove.length > 0) {
        const uniqueBoardIds = Array.from(new Set(boardIdsToMove));
        const updatedBoards = await Promise.all(
          uniqueBoardIds.map(async (boardId) => {
            const board = taskBoards.find((item) => item.id === boardId);
            if (!board) {
              throw new Error(`Task board not found: ${boardId}`);
            }
            return clientServices.taskBoards.update({
              id: boardId,
              updates: {
                name: board.name,
                emoji: board.emoji,
                folderId: folder.id,
                isPublic: board.isPublic,
                createdAt: board.createdAt,
              },
            });
          }),
        );

        if (!isAnonymous) {
          setTaskBoards((previous) => {
            const updatedById = new Map(
              updatedBoards.map((board) => [board.id, board]),
            );
            return previous.map((board) => updatedById.get(board.id) ?? board);
          });
        }
      }

      setIsWorkspaceCreateDialogOpen(false);
    } catch (error) {
      console.error("[TasksLayout] Failed to create folder:", error);
      throw error;
    }
  };

  const handleCreateTaskBoard = async (
    name: string,
    folderId: string,
    emoji?: string | null,
  ) => {
    try {
      const createdBoard = await clientServices.taskBoards.create({
        name,
        folderId: folderId || undefined,
        isPublic: false,
        ...(emoji ? { emoji } : {}),
      });
      const resolvedBoard = isAnonymous
        ? createdBoard
        : await waiterHelper.retry(
            () => clientServices.taskBoards.getById(createdBoard.id),
            { retries: 5, timeout: 150 },
          );

      if (!isAnonymous) {
        setTaskBoards((previous) => {
          const existing = previous.find(
            (board) => board.id === resolvedBoard.id,
          );
          if (existing) {
            return previous.map((board) =>
              board.id === resolvedBoard.id ? resolvedBoard : board,
            );
          }
          return [...previous, resolvedBoard];
        });
      }

      setIsWorkspaceCreateDialogOpen(false);
      router.push(tasksUrlHelper.routing.buildBoardUrl(resolvedBoard.name));
      router.refresh();
    } catch (error) {
      console.error("[TasksLayout] Failed to create task board:", error);
      throw error;
    }
  };

  const workspaceValue = {
    folders,
    taskBoards,
    setFolders,
    setTaskBoards,
    isFoldersLoading,
    isBoardsLoading,
    openCreateWorkspace: () => setIsWorkspaceCreateDialogOpen(true),
  };

  return (
    <WorkspaceProvider value={workspaceValue}>
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <TasksSidebar
          isOpen={isNavSidebarOpen}
          widthPx={tasksSidebarWidthPx}
          onWidthPxChange={setTasksSidebarWidthPx}
          activeView={activeView}
          onViewChange={handleViewChange}
          onCreateTaskBoard={() => setIsWorkspaceCreateDialogOpen(true)}
          folders={folders}
          taskBoards={taskBoards}
          setTaskBoards={setTaskBoards}
          setFolders={setFolders}
          isFoldersLoading={isFoldersLoading}
          isBoardsLoading={isBoardsLoading}
        />
        <Main
          withNavSidebar={isNavSidebarOpen}
          tasksSidebarWidthPx={tasksSidebarWidthPx}
        >
          {children}
        </Main>

        {isWorkspaceCreateDialogOpen && (
          <CreateWorkspaceDialog
            onClose={() => setIsWorkspaceCreateDialogOpen(false)}
            onCreateFolder={handleCreateFolder}
            onCreateBoard={handleCreateTaskBoard}
            taskBoards={taskBoards}
            folders={folders}
          />
        )}
      </PageContainer>
    </WorkspaceProvider>
  );
}
