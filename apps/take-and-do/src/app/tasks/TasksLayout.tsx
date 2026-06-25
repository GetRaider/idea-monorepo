"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TasksSidebar } from "@/components/TasksSidebar/TasksSidebar";
import { CreateWorkspaceDialog } from "@/components/TasksSidebar/Workspaces/CreateWorkspace/CreateWorkspaceDialog";
import {
  CollapsibleSidePanel,
  CollapsibleSidePanelMain,
} from "@/components/SidePanel";
import "@/components/Calendar/theme.css";
import { TasksShellHeaderExtrasProvider } from "@/contexts";
import { TasksAppChromeHeader } from "./TasksAppChromeHeader";
import { PageContainer, TasksLayoutMain as Main } from "../shell.ui";
import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { clampTasksSidebarWidthPx } from "@/helpers/tasks-sidebar-layout";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { waiterHelper } from "@/helpers/waiter.helper";
import { useWorkspaces } from "@/hooks/tasks/useWorkspaces";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { useTasksSidebarWidthPx } from "@/hooks/tasks/useTasksSidebarWidthPx";
import { isDuplicateWorkspaceName } from "@/helpers/workspace-name.helper";
import { invalidateWorkspaceQueries } from "@/lib/invalidate-app-queries";
import { APP_CHROME_PADDING_X } from "@/helpers/app-chrome-layout";
import { localStorageHelper } from "@/helpers/local-storage.helper";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import { toast } from "sonner";

const TASKS_PANEL_KEY = "take-and-do:tasks-panel";

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

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  useEffect(() => {
    setIsSidePanelOpen(readTasksNavSidebarOpenPref());
  }, [isSidePanelOpen]);

  const persistNavSidebarOpen = useCallback((shouldOpen: boolean) => {
    setIsSidePanelOpen(shouldOpen);
    setTaskPanelPreference(shouldOpen);
  }, []);

  const toggleNavSidebar = useCallback(() => {
    setIsSidePanelOpen((prev) => {
      const next = !prev;
      setTaskPanelPreference(next);
      return next;
    });
  }, []);

  const [tasksSidebarWidthPx, setTasksSidebarWidthPx] =
    useTasksSidebarWidthPx();
  const [isWorkspaceCreateDialogOpen, setIsWorkspaceCreateDialogOpen] =
    useState(false);

  const activeView = tasksUrlHelper.routing.getActiveViewFromPathname(
    pathname ?? "",
  );

  const handleViewChange = (view: string) => {
    switch (true) {
      case view === "today" || view === "tomorrow":
        return router.push(tasksUrlHelper.routing.buildScheduleUrl(view));
      case view === TASKS_ROOT_VIEW_ID:
        return router.push(tasksUrlHelper.routing.buildRootUrl());
      default:
        return router.push(tasksUrlHelper.routing.buildBoardUrl(view));
    }
  };

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
          if (!updated) return null;
          return updated;
        }),
      );

      if (!isAnonymous) {
        setTaskBoards((previous) => {
          const updatedById = new Map(
            updatedBoards
              .filter((board): board is NonNullable<typeof board> => !!board)
              .map((board) => [board.id, board]),
          );
          return previous.map((board) => updatedById.get(board.id) ?? board);
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
    folderId: string,
    emoji?: string | null,
  ): Promise<boolean> => {
    if (isDuplicateWorkspaceName(name.trim(), taskBoards, folders)) {
      toast.error("A workspace with this name already exists");
      return false;
    }
    const createdBoard = await clientServices.taskBoards.create({
      name,
      folderId: folderId || undefined,
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

  const navPanelWidth = clampTasksSidebarWidthPx(tasksSidebarWidthPx);

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
                <TasksAppChromeHeader />
              </div>
              <div
                className={cn(
                  "relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-6 pt-4 max-[600px]:gap-3 max-[600px]:pb-4 lg:flex-row lg:gap-6 lg:pb-6 lg:pt-4",
                  APP_CHROME_PADDING_X,
                )}
              >
                <CollapsibleSidePanel
                  expanded={isSidePanelOpen}
                  onRequestCollapse={toggleNavSidebar}
                  panelId="take-and-do-tasks-sidebar"
                  hideTooltip="Hide panel"
                  hideSrLabel="Hide tasks navigation panel"
                  columnClassName={cn(
                    "relative flex shrink-0 flex-col overflow-visible transition-[width,opacity,min-width,max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:min-h-0 lg:max-h-full lg:self-stretch",
                    !isSidePanelOpen
                      ? "pointer-events-none max-h-0 min-w-0 w-0 overflow-hidden opacity-0 lg:max-h-none"
                      : "opacity-100",
                    isSidePanelOpen &&
                      "max-lg:max-h-[min(40vh,420px)] max-lg:w-full lg:opacity-100",
                  )}
                  columnStyle={
                    isSidePanelOpen
                      ? {
                          width: `min(${navPanelWidth}px, 100%)`,
                        }
                      : {
                          width: 0,
                          minWidth: 0,
                        }
                  }
                  contentClassName="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden lg:min-h-0 lg:max-h-full"
                >
                  <TasksSidebar
                    isOpen={isSidePanelOpen}
                    widthPx={tasksSidebarWidthPx}
                    onWidthPxChange={setTasksSidebarWidthPx}
                    activeView={activeView}
                    onViewChange={handleViewChange}
                    onCreateTaskBoard={() =>
                      setIsWorkspaceCreateDialogOpen(true)
                    }
                    folders={folders}
                    taskBoards={taskBoards}
                    setTaskBoards={setTaskBoards}
                    setFolders={setFolders}
                    isFoldersLoading={isFoldersLoading}
                    isBoardsLoading={isBoardsLoading}
                  />
                </CollapsibleSidePanel>

                <CollapsibleSidePanelMain
                  isCollapsed={!isSidePanelOpen}
                  onExpand={() => persistNavSidebarOpen(true)}
                  panelId="take-and-do-tasks-sidebar"
                  showTooltip="Show panel"
                  showSrLabel="Show tasks navigation panel"
                  rootClassName="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible"
                  bodyClassName="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                >
                  {children}
                </CollapsibleSidePanelMain>
              </div>
            </div>
          </Main>
        </TasksShellHeaderExtrasProvider>

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

function setTaskPanelPreference(shouldOpen: boolean): void {
  localStorageHelper.writeString(
    TASKS_PANEL_KEY,
    shouldOpen ? "true" : "false",
  );
}

function readTasksNavSidebarOpenPref(): boolean {
  const value = localStorageHelper.readString(TASKS_PANEL_KEY);
  if (value === null) return true;
  return value !== "false";
}
