"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Spinner,
  cn,
} from "@repo/ui";
import type { Folder, TaskBoard } from "@repo/api/todex";

import {
  BoardIcon,
  ChevronIcon,
  FolderIcon,
  PlusIcon,
} from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { useTasks } from "./tasks-provider";

export default function TasksRootPage() {
  const {
    state: { folders, boards },
    actions: { openCreateDialog },
    meta: { isLoading },
  } = useTasks();

  const rootBoards = boards.filter((board) => !board.folderId);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <Button size="sm" onClick={openCreateDialog}>
          <PlusIcon size={16} />
          Create board or folder
        </Button>
      </div>
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : folders.length === 0 && boards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <p>No boards yet.</p>
          <Button size="sm" onClick={openCreateDialog}>
            Create a board
          </Button>
        </div>
      ) : (
        <div className="flex max-w-xl flex-col gap-2">
          {folders.map((folder) => (
            <RootFolderRow
              key={folder.id}
              folder={folder}
              boards={boards.filter((board) => board.folderId === folder.id)}
            />
          ))}
          {rootBoards.map((board) => (
            <RootBoardRow key={board.id} board={board} />
          ))}
        </div>
      )}
    </section>
  );
}

function RootFolderRow({ folder, boards }: RootFolderRowProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-surface"
        >
          <ChevronIcon
            size={12}
            className={cn("transition-transform", isOpen && "rotate-90")}
          />
          <FolderIcon size={16} />
          <span className="min-w-0 flex-1 truncate font-medium">
            {folder.name}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-border pl-3">
          {boards.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              No boards in this folder.
            </p>
          ) : (
            boards.map((board) => <RootBoardRow key={board.id} board={board} />)
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RootBoardRow({ board }: { board: TaskBoard }) {
  return (
    <Link
      href={tasksUrlHelper.routing.buildBoardUrl(board.name)}
      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-surface"
    >
      <BoardIcon size={16} />
      <span className="min-w-0 truncate font-medium">{board.name}</span>
    </Link>
  );
}

interface RootFolderRowProps {
  folder: Folder;
  boards: TaskBoard[];
}
