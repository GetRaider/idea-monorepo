"use client";

import Image from "next/image";

import { Dialog } from "@/components/Dialogs";
import { cn } from "@/lib/styles/utils";
import type { TaskBoard } from "@/types/workspace";

export function ScheduleBoardPickerDialog({
  open,
  boards,
  onClose,
  onSelect,
}: ScheduleBoardPickerDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      title="Select a board"
      onClose={onClose}
      showCloseButton
      maxWidth={420}
    >
      <p className="mb-4 text-sm leading-normal text-[var(--text-secondary)]">
        Choose which board this task belongs to.
      </p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {boards.map((board) => (
          <li key={board.id}>
            <button
              type="button"
              className={cn(
                "flex w-full min-w-0 items-center gap-2 rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-left text-sm text-white transition-colors",
                "hover:border-border-app hover:bg-[#2a2a2a]",
              )}
              onClick={() => onSelect(board.id)}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base leading-none">
                {board.emoji ? (
                  board.emoji
                ) : (
                  <Image
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    src="/kanban-board.svg"
                    alt=""
                  />
                )}
              </span>
              <span className="min-w-0 truncate font-medium">{board.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

interface ScheduleBoardPickerDialogProps {
  open: boolean;
  boards: TaskBoard[];
  onClose: () => void;
  onSelect: (boardId: string) => void;
}
