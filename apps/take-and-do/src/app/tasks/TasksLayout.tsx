"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TasksSidebar } from "@/components/TasksSidebar/TasksSidebar";
import { CreateWorkspaceDialog } from "@/components/TasksSidebar/Workspaces/CreateWorkspace/CreateWorkspaceDialog";
import {
  tasksSidebarEdgeHideToggleClass as tasksNavPanelHideToggleClass,
  tasksSidebarEdgeShowToggleClass as tasksNavPanelShowToggleClass,
} from "@/components/TasksSidebar/tasks-sidebar-edge-toggle-classes";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import "@/components/Calendar/calendar-theme.css";
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
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import { toast } from "sonner";

const TASKS_NAV_SIDEBAR_OPEN_KEY = "take-and-do:tasks-nav-sidebar-open";

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

  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      setIsNavSidebarOpen(
        window.localStorage.getItem(TASKS_NAV_SIDEBAR_OPEN_KEY) !== "0",
      );
    } catch {
      /* ignore */
    }
  }, []);

  const persistNavSidebarOpen = useCallback((open: boolean) => {
    setIsNavSidebarOpen(open);
    try {
      window.localStorage.setItem(TASKS_NAV_SIDEBAR_OPEN_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleNavSidebar = useCallback(() => {
    setIsNavSidebarOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(
          TASKS_NAV_SIDEBAR_OPEN_KEY,
          next ? "1" : "0",
        );
      } catch {
        /* ignore */
      }
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

  const handleNavigationChange = () => persistNavSidebarOpen(true);

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
          <Sidebar onNavigationChange={handleNavigationChange} />
          <Main
            withNavSidebar={false}
            className="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:overflow-y-auto lg:overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 px-4 pb-3 pt-4 max-[600px]:px-3 max-[600px]:pt-3 lg:px-6 lg:pb-4 lg:pt-5">
                <TasksAppChromeHeader />
              </div>
              <div
                className={cn(
                  "relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-3 max-[600px]:gap-3 max-[600px]:px-3 max-[600px]:pb-3 lg:flex-row lg:gap-6 lg:px-6 lg:pb-6 lg:pt-4",
                )}
              >
                <div
                  className={cn(
                    "relative flex shrink-0 flex-col overflow-visible transition-[width,opacity,min-width,max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:min-h-0 lg:max-h-full lg:self-stretch",
                    !isNavSidebarOpen
                      ? "pointer-events-none max-h-0 min-w-0 w-0 overflow-hidden opacity-0 lg:max-h-none"
                      : "opacity-100",
                    isNavSidebarOpen &&
                      "max-lg:max-h-[min(40vh,420px)] max-lg:w-full lg:opacity-100",
                  )}
                  style={
                    isNavSidebarOpen
                      ? {
                          width: `min(${navPanelWidth}px, 100%)`,
                        }
                      : {
                          width: 0,
                          minWidth: 0,
                        }
                  }
                >
                  <div
                    className={cn(
                      "flex min-h-0 w-full flex-1 flex-col overflow-hidden max-lg:min-h-0 max-lg:flex-none max-lg:overflow-visible motion-reduce:transition-none lg:min-h-0 lg:max-h-full",
                      !isNavSidebarOpen && "lg:pointer-events-none",
                    )}
                  >
                    <div className="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden lg:min-h-0 lg:max-h-full">
                      <TasksSidebar
                        isOpen={isNavSidebarOpen}
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
                    </div>
                  </div>
                  {isNavSidebarOpen ? (
                    <div className="pointer-events-none absolute inset-y-0 left-full z-30 hidden lg:flex lg:items-center">
                      <AppTooltip content="Hide panel" side="right">
                        <button
                          type="button"
                          onClick={toggleNavSidebar}
                          aria-expanded
                          aria-controls="take-and-do-tasks-sidebar"
                          className={cn(
                            tasksNavPanelHideToggleClass,
                            "rounded-l-none border-l-0 -translate-x-px",
                          )}
                        >
                          <span className="sr-only">
                            Hide tasks navigation panel
                          </span>
                          <ChevronLeft
                            size={13}
                            strokeWidth={2.25}
                            className="shrink-0 transition-colors group-hover:text-zinc-100"
                            aria-hidden
                          />
                        </button>
                      </AppTooltip>
                    </div>
                  ) : null}
                </div>

                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible">
                  {!isNavSidebarOpen ? (
                    <div className="pointer-events-none absolute inset-y-0 z-30 hidden left-[calc(-1.5rem-1px)] lg:flex lg:items-center">
                      <AppTooltip content="Show panel" side="right">
                        <button
                          type="button"
                          onClick={() => persistNavSidebarOpen(true)}
                          aria-expanded={false}
                          aria-controls="take-and-do-tasks-sidebar"
                          className={tasksNavPanelShowToggleClass}
                        >
                          <span className="sr-only">
                            Show tasks navigation panel
                          </span>
                          <ChevronRight
                            size={13}
                            strokeWidth={2.25}
                            className="shrink-0 transition-colors group-hover:text-zinc-100"
                            aria-hidden
                          />
                        </button>
                      </AppTooltip>
                    </div>
                  ) : null}
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    {children}
                  </div>
                </div>
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
