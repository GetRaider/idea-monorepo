"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/Sidebar/Sidebar";
import { CreateWorkspaceDialog } from "@/components/TasksSidebar/Workspaces/CreateWorkspace/CreateWorkspaceDialog";
import { useTasksSidePanel } from "@/hooks/tasksSidebar/useTasksSidePanel";
import { SidePanel } from "@/components/SidePanel";
import "@/components/Calendar/theme.css";
import { TasksShellHeaderExtrasProvider } from "@/contexts";
import { TasksHeader } from "./TasksHeader";
import { PageContainer, TasksLayoutMain as Main } from "../shell.ui";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { waiterHelper } from "@/helpers/waiter.helper";
import { useWorkspaces } from "@/hooks/tasks/useWorkspaces";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { isDuplicateWorkspaceName } from "@/helpers/workspace-name.helper";
import { invalidateWorkspaceQueries } from "@/lib/invalidate-app-queries";
import { APP_CHROME_PADDING_X } from "@/helpers/app-chrome-layout";
import { localStorageHelper } from "@/helpers/local-storage.helper";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import { toast } from "sonner";
import { useTasksViewRouter } from "@/hooks/tasks/useTasksWorkspaceViewNavigation";

const SIDE_PANEL_OPEN_KEY = "take-and-do:side-panel-open";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAnonymous = useIsAnonymous();
  const {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    setFolders,
    setTaskBoards,
  } = useWorkspaces();
  const { navigateToView: navigateToWorkspaceView } = useTasksViewRouter();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isWorkspaceCreateDialogOpen, setIsWorkspaceCreateDialogOpen] =
    useState(false);
  const activeView = tasksUrlHelper.routing.getActiveViewFromPathname(
    pathname ?? "",
  );

  useEffect(() => {
    setIsSidePanelOpen(readSidePanelOpenPreference());
  }, [isSidePanelOpen]);

  const persistNavSidebarOpen = useCallback((shouldOpen: boolean) => {
    setIsSidePanelOpen(shouldOpen);
    setSidePanelOpenPreference(shouldOpen);
  }, []);

  const toggleSidePanel = useCallback(() => {
    setIsSidePanelOpen((prev) => {
      const next = !prev;
      setSidePanelOpenPreference(next);
      return next;
    });
  }, []);

  const handleCreateFolder = async (
    name: string,
    boardIdsToMove: string[] = [],
    emoji?: string | null,
  ): Promise<boolean> => {
    if (isDuplicateWorkspaceName(name.trim(), taskBoards, folders)) {
      toast.error("A workspace with this name already exists");
      return false;
    }
    const folder = await clientServices.folders.create({ name, emoji });
    if (!folder) {
      toast.error("Can't create folder");
      return false;
    }
    if (!isAnonymous) {
      setFolders((previous) => [...previous, folder]);
    }

    if (boardIdsToMove.length > 0) {
      const uniqueBoardIds = Array.from(new Set(boardIdsToMove));
      const updatedBoards = await Promise.all(
        uniqueBoardIds.map(async (boardId) => {
          const board = taskBoards.find((item) => item.id === boardId);
          if (!board) return null;
          const updated = await clientServices.taskBoards.update({
            id: boardId,
            updates: {
              name: board.name,
              emoji: board.emoji,
              folderId: folder.id,
              isPublic: board.isPublic,
              createdAt: board.createdAt,
            },
          });
          return updated ? updated : null;
        }),
      );

      if (!isAnonymous) {
        setTaskBoards((prev) => {
          const updatedById = new Map(
            updatedBoards
              .filter((board): board is NonNullable<typeof board> => !!board)
              .map((board) => [board.id, board]),
          );
          return prev.map((board) => updatedById.get(board.id) ?? board);
        });
      }
    }

    if (!isAnonymous) {
      await invalidateWorkspaceQueries(queryClient);
    }

    setIsWorkspaceCreateDialogOpen(false);
    return true;
  };

  const handleCreateTaskBoard = async (
    name: string,
    folderId: string | null = null,
    emoji?: string | null | undefined,
  ): Promise<boolean> => {
    if (isDuplicateWorkspaceName(name.trim(), taskBoards, folders)) {
      toast.error("A workspace with this name already exists");
      return false;
    }
    const createdBoard = await clientServices.taskBoards.create({
      name,
      folderId,
      isPublic: false,
      ...(emoji ? { emoji } : {}),
    });
    if (!createdBoard) {
      toast.error("Can't create board");
      return false;
    }
    const resolvedBoard = isAnonymous
      ? createdBoard
      : await waiterHelper.retry(
          async () => {
            const board = await clientServices.taskBoards.getById(
              createdBoard.id,
            );
            if (!board) throw new Error("Task board not found");
            return board;
          },
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
      await invalidateWorkspaceQueries(queryClient);
    }

    setIsWorkspaceCreateDialogOpen(false);
    router.push(tasksUrlHelper.routing.buildBoardUrl(resolvedBoard.name));
    router.refresh();
    return true;
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

  const tasksSidePanel = useTasksSidePanel({
    activeView,
    onViewChange: (view: string) => navigateToWorkspaceView(view),
    onCreateTaskBoard: () => setIsWorkspaceCreateDialogOpen(true),
    folders,
    taskBoards,
    setTaskBoards,
    setFolders,
    isFoldersLoading,
    isBoardsLoading,
  });

  return (
    <WorkspaceProvider value={workspaceValue}>
      <PageContainer>
        <TasksShellHeaderExtrasProvider>
          <Sidebar onNavigationChange={() => persistNavSidebarOpen(true)} />
          <Main
            withNavSidebar={false}
            className="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:overflow-y-auto lg:overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={cn(
                  "shrink-0 pb-4 pt-6 max-[600px]:pb-3 max-[600px]:pt-6",
                  APP_CHROME_PADDING_X,
                )}
              >
                <TasksHeader />
              </div>
              <div
                className={cn(
                  "relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-6 pt-4 max-[600px]:gap-3 max-[600px]:pb-4 lg:flex-row lg:gap-6 lg:pb-6 lg:pt-4",
                  APP_CHROME_PADDING_X,
                )}
              >
                <SidePanel
                  expanded={isSidePanelOpen}
                  onRequestCollapse={toggleSidePanel}
                  onExpand={() => persistNavSidebarOpen(true)}
                  panelId="take-and-do-tasks-sidebar"
                  size="compact"
                  variant="solid"
                  responsive="stack"
                  sections={tasksSidePanel.sections}
                  a11y={{
                    hideTooltip: "Hide panel",
                    hideSrLabel: "Hide tasks navigation panel",
                    showTooltip: "Show panel",
                    showSrLabel: "Show tasks navigation panel",
                  }}
                  mainClassName="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible"
                  mainBodyClassName="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                >
                  {children}
                </SidePanel>
              </div>
            </div>
          </Main>
        </TasksShellHeaderExtrasProvider>

        {isWorkspaceCreateDialogOpen ? (
          <CreateWorkspaceDialog
            onClose={() => setIsWorkspaceCreateDialogOpen(false)}
            onCreateFolder={handleCreateFolder}
            onCreateBoard={handleCreateTaskBoard}
            taskBoards={taskBoards}
            folders={folders}
          />
        ) : null}

        {tasksSidePanel.dialogs}
      </PageContainer>
    </WorkspaceProvider>
  );
}

function setSidePanelOpenPreference(shouldOpen: boolean): void {
  localStorageHelper.writeString(
    SIDE_PANEL_OPEN_KEY,
    shouldOpen ? "true" : "false",
  );
}

function readSidePanelOpenPreference(): boolean {
  const value = localStorageHelper.readString(SIDE_PANEL_OPEN_KEY);
  if (value === null) return true;
  return value !== "false";
}
