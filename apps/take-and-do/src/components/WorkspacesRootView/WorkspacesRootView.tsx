"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ChangeEventHandler,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AppPageSubtitle, AppPageTitle } from "@/app/shell.ui";
import {
  ChevronRightIcon,
  PlusIcon,
  PrivateWorkspaceIcon,
  PublicWorkspaceIcon,
  SearchIcon,
} from "@/components/Icons";
import { Spinner } from "@/components/Spinner/Spinner";
import {
  FolderChevron,
  Search,
  SearchInput,
  SidebarChevronGutter,
} from "@/components/TasksSidebar/TasksSidebar.ui";
import { BoardHealthPanel } from "@/components/BoardHealthPanel";
import {
  CreateWorkspacePrimaryButton,
  TasksWorkspaceEmptyState,
} from "@/components/TasksWorkspaceEmptyState";
import { useWorkspace } from "@/contexts";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";
import type { Folder, TaskBoard } from "@/types/workspace";

export function WorkspacesRootView() {
  const router = useRouter();
  const {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    openCreateWorkspace,
  } = useWorkspace();
  const [query, setQuery] = useState("");
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );

  const queryLower = query.trim().toLowerCase();

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

  useEffect(() => {
    if (!queryLower) return;
    setExpandedFolderIds((previous) => {
      const next = new Set(previous);
      for (const folder of folders) {
        const boardsInFolder = taskBoards.filter(
          (board) => board.folderId === folder.id,
        );
        if (folder.name.toLowerCase().includes(queryLower)) {
          next.add(folder.id);
          continue;
        }
        if (
          boardsInFolder.some((board) =>
            board.name.toLowerCase().includes(queryLower),
          )
        )
          next.add(folder.id);
      }
      return next;
    });
  }, [queryLower, folders, taskBoards]);

  const visibleFolders = useMemo(() => {
    if (!queryLower) return folders;
    return folders.filter((folder) => {
      const boardsInFolder = taskBoards.filter(
        (board) => board.folderId === folder.id,
      );
      if (folder.name.toLowerCase().includes(queryLower)) return true;
      return boardsInFolder.some((board) =>
        board.name.toLowerCase().includes(queryLower),
      );
    });
  }, [folders, taskBoards, queryLower]);

  const rootBoards = useMemo(
    () => taskBoards.filter((board) => !board.folderId),
    [taskBoards],
  );

  const visibleRootBoards = useMemo(() => {
    if (!queryLower) return rootBoards;
    return rootBoards.filter((board) =>
      board.name.toLowerCase().includes(queryLower),
    );
  }, [rootBoards, queryLower]);

  const boardsVisibleInFolder = (folderId: string): TaskBoard[] => {
    const boardsInFolder = taskBoards.filter(
      (board) => board.folderId === folderId,
    );
    const folder = folders.find((item) => item.id === folderId);
    if (!queryLower || !folder) return boardsInFolder;
    if (folder.name.toLowerCase().includes(queryLower)) return boardsInFolder;
    return boardsInFolder.filter((board) =>
      board.name.toLowerCase().includes(queryLower),
    );
  };

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolderIds((previous) => {
      const next = new Set(previous);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleOpenBoard = (board: TaskBoard) => {
    router.push(tasksUrlHelper.routing.buildBoardUrl(board.name));
  };

  const isLoading = isFoldersLoading || isBoardsLoading;

  if (isLoading) {
    return (
      <RootShell>
        <WorkspacesRootLayout
          query={query}
          onQueryChange={(event) => setQuery(event.target.value)}
          onCreateWorkspace={openCreateWorkspace}
        >
          <Spinner className="h-full min-h-[240px] flex-1" />
        </WorkspacesRootLayout>
      </RootShell>
    );
  }

  if (folders.length === 0 && taskBoards.length === 0) {
    return (
      <RootShell>
        <WorkspacesRootLayout
          variant="centeredEmpty"
          query={query}
          onQueryChange={(event) => setQuery(event.target.value)}
          onCreateWorkspace={openCreateWorkspace}
        >
          <TasksWorkspaceEmptyState
            className="min-h-0 justify-center py-8"
            onCreateWorkspace={openCreateWorkspace}
          />
        </WorkspacesRootLayout>
      </RootShell>
    );
  }

  const listHasNoSearchHits =
    queryLower.length > 0 &&
    visibleFolders.length === 0 &&
    visibleRootBoards.length === 0;

  return (
    <RootShell>
      <WorkspacesRootLayout
        query={query}
        onQueryChange={(event) => setQuery(event.target.value)}
        onCreateWorkspace={openCreateWorkspace}
        sidePanel={
          taskBoards.length > 0 ? (
            <BoardHealthPanel boards={taskBoards} />
          ) : null
        }
      >
        {listHasNoSearchHits ? (
          <p className="py-10 text-center text-sm text-[var(--text-secondary)]">
            No workspaces match your search.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleFolders.map((folder) => (
              <FolderSection
                key={folder.id}
                folder={folder}
                boards={boardsVisibleInFolder(folder.id)}
                isExpanded={expandedFolderIds.has(folder.id)}
                onToggleExpanded={() => toggleFolderExpanded(folder.id)}
                onOpenBoard={handleOpenBoard}
              />
            ))}
            {visibleRootBoards.map((board) => (
              <WorkspaceBoardCard
                key={board.id}
                board={board}
                onOpen={() => handleOpenBoard(board)}
                showChevronGutter
              />
            ))}
          </div>
        )}
      </WorkspacesRootLayout>
    </RootShell>
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
        className="flex w-full min-w-0 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left transition-colors hover:bg-[var(--input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
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
        "flex w-full min-w-0 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left transition-colors hover:bg-[var(--input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
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
  query,
  onQueryChange,
  onCreateWorkspace,
  children,
  variant = "default",
  sidePanel,
}: WorkspacesRootLayoutProps) {
  return (
    <div className="box-border flex w-full min-h-0 flex-1 flex-col px-6 pt-[18px] pb-6">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-8 md:gap-y-4">
        <div className="min-w-0 text-left">
          <AppPageTitle className="text-left">Tasks</AppPageTitle>
          <AppPageSubtitle className="text-balance text-left">
            Manage your tasks, boards, and schedules in one place.
          </AppPageSubtitle>
        </div>
        <div className="flex w-full min-w-0 flex-row flex-wrap items-center justify-end gap-3 md:w-auto md:shrink-0">
          <Search className="min-w-0 flex-1 md:w-64 md:flex-none lg:w-72">
            <SearchIcon size={16} className="shrink-0 opacity-80" />
            <SearchInput
              type="search"
              value={query}
              onChange={onQueryChange}
              placeholder="Search workspaces by name"
              autoComplete="off"
            />
          </Search>
          <CreateWorkspacePrimaryButton
            onClick={onCreateWorkspace}
            className="shrink-0 px-[22px] py-3 text-sm font-medium hover:translate-y-0 hover:bg-[#6346b0]"
          >
            <PlusIcon size={18} className="shrink-0 text-white" />
            Create Workspace
          </CreateWorkspacePrimaryButton>
        </div>
      </div>

      {variant === "centeredEmpty" ? (
        <div className="flex min-h-[min(60vh,560px)] flex-1 flex-col items-center justify-center px-2 py-12">
          {children}
        </div>
      ) : sidePanel ? (
        <div className="mt-4 grid min-h-0 w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,300px)] lg:items-start lg:gap-x-8">
          <div className="flex min-w-0 flex-col gap-3">{children}</div>
          <div className="min-w-0">{sidePanel}</div>
        </div>
      ) : (
        <div className="mt-4 flex min-w-0 flex-col gap-3">{children}</div>
      )}
    </div>
  );
}

function RootShell({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", className)}
      {...props}
    />
  );
}

interface WorkspacesRootLayoutProps {
  query: string;
  onQueryChange: ChangeEventHandler<HTMLInputElement>;
  onCreateWorkspace: () => void;
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
  /** Aligns emoji column with folder rows that use a chevron. */
  showChevronGutter?: boolean;
  /** Slightly inset styling when rendered under an expanded folder. */
  nested?: boolean;
}
