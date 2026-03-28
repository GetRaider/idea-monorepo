"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TasksSidebar } from "@/components/TasksSidebar/TasksSidebar";
import { CreateWorkspaceDialog } from "@/components/TasksSidebar/Workspaces/CreateWorkspace/CreateWorkspaceDialog";
import { PageContainer, TasksLayoutMain as Main } from "../shell.ui";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { waiterHelper } from "@/helpers/waiter.helper";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { useTasksSidebarWidthPx } from "@/hooks/useTasksSidebarWidthPx";
import { apiServices } from "@/services/api";
import { toast } from "sonner";

export default function TasksLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
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
    router.push(tasksUrlHelper.routing.buildBoardUrl(view));
  };

  const handleNavigationChange = () => setIsNavSidebarOpen(true);

  const handleCreateFolder = async (
    name: string,
    boardIdsToMove: string[] = [],
  ) => {
    try {
      const folder = await apiServices.folders.create(name);
      setFolders((prev) => [...prev, folder]);

      if (boardIdsToMove.length > 0) {
        const uniqueBoardIds = Array.from(new Set(boardIdsToMove));
        const updatedBoards = await Promise.all(
          uniqueBoardIds.map((boardId) =>
            apiServices.taskBoards.update(boardId, { folderId: folder.id }),
          ),
        );

        setTaskBoards((prev) => {
          const updatedById = new Map(
            updatedBoards.map((board) => [board.id, board]),
          );
          return prev.map((board) => updatedById.get(board.id) ?? board);
        });
      }

      setIsWorkspaceCreateDialogOpen(false);
    } catch (error) {
      console.error("[TasksLayout] Failed to create folder:", error);
      toast.error("Failed to create folder.");
    }
  };

  const handleCreateTaskBoard = async (name: string, folderId: string) => {
    try {
      const createdBoard = await apiServices.taskBoards.create({
        name,
        folderId: folderId || undefined,
        isPublic: false,
      });
      const resolvedBoard = await waiterHelper.retry(
        () => apiServices.taskBoards.getById(createdBoard.id),
        { retries: 5, timeout: 150 },
      );

      setTaskBoards((prev) => {
        const existing = prev.find((board) => board.id === resolvedBoard.id);
        if (existing) {
          return prev.map((board) =>
            board.id === resolvedBoard.id ? resolvedBoard : board,
          );
        }
        return [...prev, resolvedBoard];
      });

      setIsWorkspaceCreateDialogOpen(false);
      router.push(tasksUrlHelper.routing.buildBoardUrl(resolvedBoard.name));
      router.refresh();
    } catch (error) {
      console.error("[TasksLayout] Failed to create task board:", error);
      toast.error("Failed to create task board.");
    }
  };

  const workspaceValue = {
    folders,
    taskBoards,
    setFolders,
    setTaskBoards,
    isFoldersLoading,
    isBoardsLoading,
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
