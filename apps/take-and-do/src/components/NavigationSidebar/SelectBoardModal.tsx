"use client";

import { useState, useEffect } from "react";
import { TaskBoard } from "@/types/workspace";
import { taskBoardsService } from "@/services/api/taskBoards.service";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  FormGroup,
  Label,
  Select,
  ButtonGroup,
  Button,
} from "./SelectBoardModal.styles";

export default function SelectBoardModal({
  onClose,
  onSelect,
}: SelectBoardModalProps) {
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const allBoards = await taskBoardsService.getAll();
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Select Task Board</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

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
      </ModalContainer>
    </ModalOverlay>
  );
}

interface SelectBoardModalProps {
  onClose: () => void;
  onSelect: (boardId: string) => void;
}


