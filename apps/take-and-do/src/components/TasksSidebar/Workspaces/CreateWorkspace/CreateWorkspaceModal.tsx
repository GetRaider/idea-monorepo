"use client";

import Image from "next/image";
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
} from "./CreateWorkspace.ui";
import { toast } from "sonner";
import { Dropdown } from "@/components/Dropdown";
import { DropdownMultiSelect } from "@/components/DropdownMultiSelect";
import { Folder, TaskBoard } from "@/types/workspace";

export type WorkspaceCreateType = "folder" | "board";

export function CreateWorkspaceDialog({
  onClose,
  onCreateFolder,
  onCreateBoard,
  taskBoards,
  folders,
}: CreateWorkspaceModalProps) {
  const [type, setType] = useState<WorkspaceCreateType>("board");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      if (type === "folder") {
        await onCreateFolder(name.trim(), selectedBoardIds);
      } else {
        await onCreateBoard(name.trim(), folderId);
      }
      toast.success(type === "folder" ? "Folder created" : "Board created");
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
    <Dialog
      title="Create Workspace"
      onClose={onClose}
      maxWidth={560}
      minHeight={440}
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Type</Label>
          <TypeSelector>
            <TypeButton
              type="button"
              $selected={type === "folder"}
              onClick={() => setType("folder")}
            >
              <Image src="/folder.svg" alt="Folder" width={20} height={20} />
              Folder
            </TypeButton>
            <TypeButton
              type="button"
              $selected={type === "board"}
              onClick={() => setType("board")}
            >
              <Image
                src="/kanban-board.svg"
                alt="Board"
                width={20}
                height={20}
              />
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

        <FormGroup>
          {type === "folder" ? (
            <>
              <Label htmlFor="board-names">Board Names</Label>
              <DropdownMultiSelect
                id="board-names"
                listTitle="Boards"
                menuMinWidth={360}
                options={taskBoards.map((board) => ({
                  label: board.name,
                  value: board.id,
                }))}
                value={selectedBoardIds}
                onChange={setSelectedBoardIds}
                placeholder="Select boards"
                emptyMessage="No boards yet"
              />
            </>
          ) : (
            <>
              <Label htmlFor="folder-name">Folder</Label>
              <Dropdown
                id="folder-name"
                fullWidth
                menuMinWidth={360}
                placeholder="Select folder..."
                options={[
                  { label: "No folder", value: "" },
                  ...folders.map((folder) => ({
                    label: folder.name,
                    value: folder.id,
                  })),
                ]}
                value={folderId}
                onChange={setFolderId}
              />
            </>
          )}
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
  onCreateFolder: (name: string, boardIdsToMove: string[]) => Promise<void>;
  onCreateBoard: (name: string, folderId: string) => Promise<void>;
  taskBoards: TaskBoard[];
  folders: Folder[];
}
