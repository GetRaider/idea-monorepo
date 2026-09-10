"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import type { Folder, TaskBoard } from "@repo/api/todex";

import {
  BoardIcon,
  CalendarIcon,
  ChevronIcon,
  ClockIcon,
  EllipsisIcon,
  FolderIcon,
  PlusIcon,
} from "@components/icons";
import {
  readTasksSidebarOpen,
  writeTasksSidebarOpen,
} from "@/helpers/tasks-sidebar-open";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { useTasks } from "./tasks-provider";
import { useSpaceDialogs } from "./space-dialogs";

export function TasksModuleSidebar() {
  const {
    state: { folders, boards, view },
    actions: { openCreateDialog },
  } = useTasks();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(readTasksSidebarOpen());
  }, []);

  const setOpen = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    writeTasksSidebarOpen(nextOpen);
  };

  const activeBoardId = view.kind === "board" ? view.boardId : null;
  const rootBoards = boards.filter((board) => !board.folderId);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-sidebar py-3 transition-[width]",
        isOpen ? "w-[220px] px-3" : "w-14 items-center px-1.5",
      )}
    >
      <div
        className={cn("mb-3 flex", isOpen ? "justify-end" : "justify-center")}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setOpen(!isOpen)}
          aria-label={isOpen ? "Collapse tasks panel" : "Expand tasks panel"}
        >
          <ChevronIcon
            size={16}
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </Button>
      </div>
      <section className="mb-4 w-full">
        {isOpen ? (
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Schedules
          </h2>
        ) : null}
        <NavRow
          href={tasksUrlHelper.routing.buildScheduleUrl("today")}
          active={view.kind === "schedule" && view.schedule === "today"}
          icon={<ClockIcon size={16} />}
          label="Today"
          collapsed={!isOpen}
        />
        <NavRow
          href={tasksUrlHelper.routing.buildScheduleUrl("tomorrow")}
          active={view.kind === "schedule" && view.schedule === "tomorrow"}
          icon={<CalendarIcon size={16} />}
          label="Tomorrow"
          collapsed={!isOpen}
        />
      </section>
      <section className="flex min-h-0 w-full flex-1 flex-col overflow-auto">
        <div
          className={cn(
            "mb-2 flex items-center",
            isOpen ? "justify-between px-2" : "justify-center",
          )}
        >
          {isOpen ? (
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Spaces
            </h2>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={openCreateDialog}
                aria-label="Create board or folder"
              >
                <PlusIcon size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Create board or folder</TooltipContent>
          </Tooltip>
        </div>
        {isOpen
          ? folders.map((folder) => (
              <FolderGroup
                key={folder.id}
                folder={folder}
                boards={boards.filter((board) => board.folderId === folder.id)}
                activeBoardId={activeBoardId}
              />
            ))
          : null}
        {(isOpen ? rootBoards : boards).map((board) => (
          <NavRow
            key={board.id}
            href={tasksUrlHelper.routing.buildBoardUrl(board.name)}
            active={activeBoardId === board.id}
            icon={<BoardIcon size={16} />}
            label={board.name}
            collapsed={!isOpen}
            menu={isOpen ? <BoardMenu board={board} /> : null}
          />
        ))}
      </section>
    </aside>
  );
}

function FolderGroup({ folder, boards, activeBoardId }: FolderGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="mt-1"
    >
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <ChevronIcon
              size={12}
              className={cn(
                "shrink-0 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            <FolderIcon size={16} />
            <span className="min-w-0 truncate">{folder.name}</span>
          </button>
        </CollapsibleTrigger>
        <FolderMenu folder={folder} />
      </div>
      <CollapsibleContent>
        {boards.map((board) => (
          <NavRow
            key={board.id}
            href={tasksUrlHelper.routing.buildBoardUrl(board.name)}
            active={activeBoardId === board.id}
            icon={<BoardIcon size={16} />}
            label={board.name}
            nested
            menu={<BoardMenu board={board} />}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavRow({
  href,
  active,
  icon,
  label,
  collapsed = false,
  nested = false,
  menu,
}: NavRowProps) {
  const row = (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg py-2 text-sm transition-colors",
        collapsed ? "justify-center px-0" : "flex-1 px-3 text-left",
        nested && !collapsed && "pl-8",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      {collapsed ? null : <span className="min-w-0 truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {row}
      {menu}
    </div>
  );
}

function BoardMenu({ board }: { board: TaskBoard }) {
  const actions = useSpaceDialogs();
  return (
    <RowMenu>
      <DropdownMenuItem onSelect={() => actions.openRenameBoard(board)}>
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => actions.openMoveBoard(board)}>
        Move to folder
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onSelect={() => actions.openDeleteBoard(board)}
      >
        Delete
      </DropdownMenuItem>
    </RowMenu>
  );
}

function FolderMenu({ folder }: { folder: Folder }) {
  const actions = useSpaceDialogs();
  return (
    <RowMenu>
      <DropdownMenuItem onSelect={() => actions.openRenameFolder(folder)}>
        Rename
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onSelect={() => actions.openDeleteFolder(folder)}
      >
        Delete
      </DropdownMenuItem>
    </RowMenu>
  );
}

function RowMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          aria-label="Space actions"
        >
          <EllipsisIcon size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FolderGroupProps {
  folder: Folder;
  boards: TaskBoard[];
  activeBoardId: string | null;
}

interface NavRowProps {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  collapsed?: boolean;
  nested?: boolean;
  menu?: ReactNode;
}
