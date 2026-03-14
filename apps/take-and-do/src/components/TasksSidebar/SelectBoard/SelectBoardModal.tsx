"use client";

import { useState, useEffect } from "react";
import { TaskBoard } from "@/types/workspace";
import { apiServices } from "@/services/api";
import { Dialog } from "@/components/Dialogs";
import {
  FormGroup,
  Label,
  Select,
  ButtonGroup,
  Button,
} from "./SelectBoardModal.styles";

export function SelectBoardModal({ onClose, onSelect }: SelectBoardModalProps) {
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
            $primary
            disabled={!selectedBoardId || isLoading || boards.length === 0}
          >
            Save
          </Button>
        </ButtonGroup>
      </form>
    </Dialog>
  );
}

interface SelectBoardModalProps {
  onClose: () => void;
  onSelect: (boardId: string) => void;
}
