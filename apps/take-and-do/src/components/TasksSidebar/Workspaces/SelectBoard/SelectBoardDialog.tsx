"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/Dialogs";
import {
  DialogFormActions,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

const FormGroup = DialogFormGroup;
const Label = DialogFormLabel;
const ButtonGroup = DialogFormActions;
const Button = DialogFormButton;

export function SelectBoardDialog({
  onClose,
  onSelect,
}: SelectBoardDialogProps) {
  const { taskBoards, isBoardsLoading } = useWorkspaceRepository();
  const [selectedBoardId, setSelectedBoardId] = useState("");

  useEffect(() => {
    if (taskBoards.length === 0) {
      setSelectedBoardId("");
      return;
    }

    setSelectedBoardId((previous) =>
      taskBoards.some((board) => board.id === previous)
        ? previous
        : taskBoards[0].id,
    );
  }, [taskBoards]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBoardId) return;
    onSelect(selectedBoardId);
  };

  return (
    <Dialog title="Select Task Board" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="board-select">Board</Label>
          {isBoardsLoading ? (
            <Select disabled>
              <option>Loading...</option>
            </Select>
          ) : taskBoards.length === 0 ? (
            <Select disabled>
              <option>No boards available</option>
            </Select>
          ) : (
            <Select
              id="board-select"
              value={selectedBoardId}
              onChange={(event) => setSelectedBoardId(event.target.value)}
              required
            >
              {taskBoards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </Select>
          )}
        </FormGroup>

        <ButtonGroup>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            primary
            disabled={
              !selectedBoardId || isBoardsLoading || taskBoards.length === 0
            }
          >
            Save
          </Button>
        </ButtonGroup>
      </form>
    </Dialog>
  );
}

function Select({ className, ref, ...props }: UiProps<"select">) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-all duration-200 focus:border-white/35 focus:bg-[#252525] [&_option]:bg-input-bg [&_option]:text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

interface SelectBoardDialogProps {
  onClose: () => void;
  onSelect: (boardId: string) => void;
}
