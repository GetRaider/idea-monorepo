"use client";

import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ChevronRightIcon,
  PrivateWorkspaceIcon,
  PublicWorkspaceIcon,
} from "@/components/Icons";
import { Spinner } from "@/components/Spinner/Spinner";
import {
  FolderChevron,
  SidebarChevronGutter,
} from "@/components/TasksSidebar/TasksSidebar.ui";
import { BoardHealthPanel } from "@/components/BoardHealthPanel";
import { TasksWorkspaceEmptyState } from "@/components/TasksWorkspaceEmptyState";
import { useWorkspace } from "@/contexts";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { cn } from "@/lib/styles/utils";
import type { Folder, TaskBoard } from "@/types/workspace";

import { TasksMainWorkArea } from "./TasksMainWorkArea";
import { TasksRouteRootShell } from "./TasksRootShell";

export default function TasksPage() {
  const router = useRouter();
  const {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    openCreateWorkspace,
  } = useWorkspace();
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );

  useLayoutEffect(() => {
    setExpandedFolderIds((previous) => {
      const next = new Set(previous);
      for (const folder of folders) {
        if (!previous.has(folder.id)) next.add(folder.id);
      }
      for (const id of [...next]) {
        if (!folders.some((folder) => folder.id === id)) next.delete(id);
      }
      return next;
    });
  }, [folders]);

  const rootBoards = useMemo(
    () => taskBoards.filter((board) => !board.folderId),
    [taskBoards],
  );

  const boardsInFolder = (folderId: string): TaskBoard[] =>
    taskBoards.filter((board) => board.folderId === folderId);

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolderIds((previous) => {
      const next = new Set(previous);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  };

  const handleOpenBoard = (board: TaskBoard) => {
    router.push(tasksUrlHelper.routing.buildBoardUrl(board.name));
  };

  const isLoading = isFoldersLoading || isBoardsLoading;

  if (isLoading) {
    return (
      <TasksRouteRootShell>
        <WorkspacesRootLayout>
          <TasksMainWorkArea>
            <Spinner className="h-full min-h-[240px] flex-1" />
          </TasksMainWorkArea>
        </WorkspacesRootLayout>
      </TasksRouteRootShell>
    );
  }

  if (folders.length === 0 && taskBoards.length === 0) {
    return (
      <TasksRouteRootShell>
        <WorkspacesRootLayout variant="centeredEmpty">
          <TasksWorkspaceEmptyState
            className="min-h-0 justify-center py-8"
            onCreateWorkspace={openCreateWorkspace}
          />
        </WorkspacesRootLayout>
      </TasksRouteRootShell>
    );
  }

  return (
    <TasksRouteRootShell>
      <WorkspacesRootLayout
        sidePanel={
          taskBoards.length > 0 ? (
            <BoardHealthPanel boards={taskBoards} />
          ) : undefined
        }
      >
        <div className="flex flex-col gap-3">
          {folders.map((folder) => (
            <FolderSection
              key={folder.id}
              folder={folder}
              boards={boardsInFolder(folder.id)}
              isExpanded={expandedFolderIds.has(folder.id)}
              onToggleExpanded={() => toggleFolderExpanded(folder.id)}
              onOpenBoard={handleOpenBoard}
            />
          ))}
          {rootBoards.map((board) => (
            <WorkspaceBoardCard
              key={board.id}
              board={board}
              onOpen={() => handleOpenBoard(board)}
              showChevronGutter
            />
          ))}
        </div>
      </WorkspacesRootLayout>
    </TasksRouteRootShell>
  );
}

function FolderSection({
  folder,
  boards,
  isExpanded,
  onToggleExpanded,
  onOpenBoard,
}: FolderSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full min-w-0 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--background-primary)] p-4 text-left transition-colors hover:bg-[var(--input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      >
        <FolderChevron isExpanded={isExpanded} aria-hidden>
          <ChevronRightIcon size={11} />
        </FolderChevron>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--input-bg)] text-xl leading-none">
          {folder.emoji ? (
            <span aria-hidden>{folder.emoji}</span>
          ) : (
            <Image
              width={28}
              height={28}
              src="/folder.svg"
              alt=""
              className="opacity-90"
            />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-[var(--text-primary)]">
          {folder.name}
        </span>
        <VisibilityBadge isPublic={folder.isPublic} />
      </button>
      {isExpanded && boards.length > 0 ? (
        <ul className="mt-2 ml-3 flex w-[calc(100%-0.75rem)] max-w-full list-none flex-col gap-2 pl-3 pt-0.5">
          {boards.map((board) => (
            <li key={board.id} className="min-w-0">
              <WorkspaceBoardCard
                board={board}
                onOpen={() => onOpenBoard(board)}
                showChevronGutter
                nested
              />
            </li>
          ))}
        </ul>
      ) : null}
      {isExpanded && boards.length === 0 ? (
        <p className="ml-3 mt-2 pl-3 pt-0.5 text-sm text-[var(--text-tertiary)]">
          No boards in this folder.
        </p>
      ) : null}
    </div>
  );
}

function WorkspaceBoardCard({
  board,
  onOpen,
  showChevronGutter = false,
  nested = false,
}: WorkspaceBoardCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--background-primary)] p-4 text-left transition-colors hover:bg-[var(--input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
        nested && "rounded-xl py-3 pl-3 pr-3",
      )}
    >
      {showChevronGutter ? <SidebarChevronGutter /> : null}
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--input-bg)] text-xl leading-none",
          nested ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        {board.emoji ? (
          <span aria-hidden>{board.emoji}</span>
        ) : (
          <Image
            width={nested ? 24 : 28}
            height={nested ? 24 : 28}
            src="/kanban-board.svg"
            alt=""
            className="opacity-90"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-[var(--text-primary)]">
          {board.name}
        </span>
      </span>
      <VisibilityBadge isPublic={board.isPublic} />
    </button>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        isPublic
          ? "bg-white/10 text-[var(--text-secondary)]"
          : "bg-white/5 text-[var(--text-tertiary)]",
      )}
    >
      {isPublic ? (
        <PublicWorkspaceIcon size={12} className="opacity-90" />
      ) : (
        <PrivateWorkspaceIcon size={12} className="opacity-90" />
      )}
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

function WorkspacesRootLayout({
  children,
  variant = "default",
  sidePanel,
}: WorkspacesRootLayoutProps) {
  if (variant === "centeredEmpty") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-[min(60vh,560px)] flex-1 flex-col items-center justify-center px-2 py-12">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {sidePanel ? (
        <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,300px)] lg:items-start lg:gap-x-8">
          <div className="flex min-h-0 min-w-0 flex-col">
            <TasksMainWorkArea>{children}</TasksMainWorkArea>
          </div>
          <div className="min-w-0">{sidePanel}</div>
        </div>
      ) : (
        <TasksMainWorkArea>{children}</TasksMainWorkArea>
      )}
    </div>
  );
}

interface WorkspacesRootLayoutProps {
  children: ReactNode;
  variant?: "default" | "centeredEmpty";
  sidePanel?: ReactNode;
}

interface FolderSectionProps {
  folder: Folder;
  boards: TaskBoard[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onOpenBoard: (board: TaskBoard) => void;
}

interface WorkspaceBoardCardProps {
  board: TaskBoard;
  onOpen: () => void;
  showChevronGutter?: boolean;
  nested?: boolean;
}
