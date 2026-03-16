"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialogs";
import {
  FormGroup,
  Label,
  Input,
  TypeSelector,
  TypeButton,
  ButtonGroup,
  Button,
} from "./CreateWorkspace.styles";
import { toast } from "sonner";

export type WorkspaceCreateType = "folder" | "board";

export function CreateWorkspaceModal({
  onClose,
  onCreateFolder,
  onCreateBoard,
}: CreateWorkspaceModalProps) {
  const [type, setType] = useState<WorkspaceCreateType>("board");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      if (type === "folder") {
        await onCreateFolder(name.trim());
      } else {
        await onCreateBoard(name.trim());
      }
      toast.success(
        type === "folder"
          ? "Folder created successfully"
          : "Board created successfully",
      );
    } catch {
      toast.error(
        type === "folder"
          ? "Failed to create folder"
          : "Failed to create board",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog title="Create Workspace" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Type</Label>
          <TypeSelector>
            <TypeButton
              type="button"
              $selected={type === "folder"}
              onClick={() => setType("folder")}
            >
              <img src="/folder.svg" alt="Folder" />
              Folder
            </TypeButton>
            <TypeButton
              type="button"
              $selected={type === "board"}
              onClick={() => setType("board")}
            >
              <img src="/kanban-board.svg" alt="Board" />
              Board
            </TypeButton>
          </TypeSelector>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="workspace-name">Name</Label>
          <Input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "folder"
                ? "Enter folder name..."
                : "Enter task board name..."
            }
            autoFocus
            required
            maxLength={32}
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" $primary disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </ButtonGroup>
      </form>
    </Dialog>
  );
}

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onCreateFolder: (name: string) => Promise<void>;
  onCreateBoard: (name: string) => Promise<void>;
}
