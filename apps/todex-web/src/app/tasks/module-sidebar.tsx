"use client";

import { useState, type ReactNode } from "react";
import { Button, Input, cn } from "@repo/ui";

import { BoardIcon, ClockIcon, PlusIcon } from "@components/icons";

import { useTasks } from "./tasks-provider";

export function TasksModuleSidebar() {
  const {
    state: { folders, boards, view },
    actions: { selectBoard, selectSchedule, createFolder, createBoard },
  } = useTasks();
  const [folderName, setFolderName] = useState("");
  const [boardName, setBoardName] = useState("");
  const [boardFolderId, setBoardFolderId] = useState("");
  const [creating, setCreating] = useState<"board" | "folder" | null>(null);
  const activeBoardId =
    view.kind === "board" ? (view.boardId ?? boards[0]?.id ?? null) : null;

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col gap-6 overflow-auto border-r border-border bg-sidebar px-3 py-4">
      <section>
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Schedules
        </h2>
        <NavRow
          active={view.kind === "schedule" && view.schedule === "today"}
          onClick={() => selectSchedule("today")}
          icon={<ClockIcon size={16} />}
          label="Today"
        />
        <NavRow
          active={view.kind === "schedule" && view.schedule === "tomorrow"}
          onClick={() => selectSchedule("tomorrow")}
          icon={<ClockIcon size={16} />}
          label="Tomorrow"
        />
      </section>
      <section className="min-h-0 flex-1">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Boards
          </h2>
          <button
            type="button"
            className="rounded-md p-1 text-muted hover:bg-surface hover:text-foreground"
            onClick={() => setCreating(creating === "board" ? null : "board")}
          >
            <PlusIcon size={14} />
          </button>
        </div>
        {boards
          .filter((board) => !board.folderId)
          .map((board) => (
            <NavRow
              key={board.id}
              active={activeBoardId === board.id}
              onClick={() => selectBoard(board.id)}
              icon={<BoardIcon size={16} />}
              label={board.name}
            />
          ))}
        {folders.map((folder) => {
          const folderBoards = boards.filter(
            (board) => board.folderId === folder.id,
          );
          return (
            <div key={folder.id} className="mt-3">
              <div className="px-2 pb-1 text-xs text-muted">{folder.name}</div>
              {folderBoards.map((board) => (
                <NavRow
                  key={board.id}
                  active={activeBoardId === board.id}
                  onClick={() => selectBoard(board.id)}
                  icon={<BoardIcon size={16} />}
                  label={board.name}
                />
              ))}
            </div>
          );
        })}
        {creating === "board" ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!boardName.trim()) return;
              createBoard(boardName.trim(), boardFolderId || null);
              setBoardName("");
              setBoardFolderId("");
              setCreating(null);
            }}
          >
            <Input
              autoFocus
              placeholder="Board name"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
            />
            {folders.length > 0 ? (
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                value={boardFolderId}
                onChange={(event) => setBoardFolderId(event.target.value)}
              >
                <option value="">Root</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button type="submit" size="sm" className="w-full">
              Add board
            </Button>
          </form>
        ) : null}
        {creating === "folder" ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!folderName.trim()) return;
              createFolder(folderName.trim());
              setFolderName("");
              setCreating(null);
            }}
          >
            <Input
              autoFocus
              placeholder="Folder name"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <Button type="submit" size="sm" className="w-full">
              Add folder
            </Button>
          </form>
        ) : (
          <button
            type="button"
            className="mt-3 px-2 text-xs text-muted hover:text-foreground"
            onClick={() => setCreating("folder")}
          >
            New folder
          </button>
        )}
      </section>
    </aside>
  );
}

function NavRow({ active, onClick, icon, label }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-surface text-foreground"
          : "text-muted hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

interface NavRowProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}
