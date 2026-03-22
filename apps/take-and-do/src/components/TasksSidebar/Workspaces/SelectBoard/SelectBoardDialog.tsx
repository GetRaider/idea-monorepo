"use client";

import { useState, useEffect } from "react";

import { Dialog } from "@/components/Dialogs";
import {
  DialogFormActions,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs/DialogForm";
import { TaskBoard } from "@/types/workspace";
import { apiServices } from "@/services/api";
import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

const FormGroup = DialogFormGroup;
const Label = DialogFormLabel;
const ButtonGroup = DialogFormActions;
const Button = DialogFormButton;

export function SelectBoardDialog({
  onClose,
  onSelect,
}: SelectBoardDialogProps) {
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const allBoards = await apiServices.taskBoards.getAll();
        setBoards(allBoards);
        if (allBoards.length > 0) {
          setSelectedBoardId(allBoards[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch task boards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardId) return;
    onSelect(selectedBoardId);
  };

  return (
    <Dialog title="Select Task Board" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="board-select">Board</Label>
          {isLoading ? (
            <Select disabled>
              <option>Loading...</option>
            </Select>
          ) : boards.length === 0 ? (
            <Select disabled>
              <option>No boards available</option>
            </Select>
          ) : (
            <Select
              id="board-select"
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              required
            >
              {boards.map((board) => (
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
            disabled={!selectedBoardId || isLoading || boards.length === 0}
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
        "w-full cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-[#7255c1] focus:bg-[#252525] [&_option]:bg-input-bg [&_option]:text-white",
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
