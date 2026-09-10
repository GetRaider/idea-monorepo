"use client";

import {
  createContext,
  use,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogActions,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import type { Folder, TaskBoard } from "@repo/api/todex";

import { useTasks } from "./tasks-provider";

const SpaceDialogsContext = createContext<SpaceDialogsContextValue | null>(
  null,
);

export function SpaceDialogsProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<SpaceDialog>(null);

  return (
    <SpaceDialogsContext.Provider
      value={{
        openRenameBoard: (board) => setDialog({ kind: "renameBoard", board }),
        openMoveBoard: (board) => setDialog({ kind: "moveBoard", board }),
        openDeleteBoard: (board) => setDialog({ kind: "deleteBoard", board }),
        openRenameFolder: (folder) =>
          setDialog({ kind: "renameFolder", folder }),
        openDeleteFolder: (folder) =>
          setDialog({ kind: "deleteFolder", folder }),
      }}
    >
      {children}
      <SpaceDialogsHost dialog={dialog} onClose={() => setDialog(null)} />
    </SpaceDialogsContext.Provider>
  );
}

export function useSpaceDialogs() {
  const value = use(SpaceDialogsContext);
  if (!value) {
    throw new Error("useSpaceDialogs must be used within SpaceDialogsProvider");
  }
  return value;
}

function SpaceDialogsHost({ dialog, onClose }: SpaceDialogsHostProps) {
  const {
    state: { folders, isCreateDialogOpen },
    actions: {
      closeCreateDialog,
      updateFolder,
      updateBoard,
      removeFolder,
      removeBoard,
    },
  } = useTasks();

  if (isCreateDialogOpen) {
    return <CreateSpaceDialog onClose={closeCreateDialog} folders={folders} />;
  }

  if (dialog?.kind === "renameBoard") {
    return (
      <NameDialog
        title="Rename board"
        initialName={dialog.board.name}
        onClose={onClose}
        onSubmit={(name) => updateBoard(dialog.board.id, { name })}
      />
    );
  }

  if (dialog?.kind === "moveBoard") {
    return (
      <MoveBoardDialog
        board={dialog.board}
        folders={folders}
        onClose={onClose}
        onSubmit={(folderId) => updateBoard(dialog.board.id, { folderId })}
      />
    );
  }

  if (dialog?.kind === "deleteBoard") {
    return (
      <ConfirmDialog
        title="Delete board"
        description={`Delete board "${dialog.board.name}" and all its tasks?`}
        confirmLabel="Delete"
        onClose={onClose}
        onConfirm={() => removeBoard(dialog.board.id)}
      />
    );
  }

  if (dialog?.kind === "renameFolder") {
    return (
      <NameDialog
        title="Rename folder"
        initialName={dialog.folder.name}
        onClose={onClose}
        onSubmit={(name) => updateFolder(dialog.folder.id, { name })}
      />
    );
  }

  if (dialog?.kind === "deleteFolder") {
    return (
      <ConfirmDialog
        title="Delete folder"
        description={`Delete folder "${dialog.folder.name}"? Boards inside it stay and move to the root.`}
        confirmLabel="Delete"
        onClose={onClose}
        onConfirm={() => removeFolder(dialog.folder.id)}
      />
    );
  }

  return null;
}

function CreateSpaceDialog({
  onClose,
  folders,
}: {
  onClose: () => void;
  folders: Folder[];
}) {
  const {
    actions: { createFolder, createBoard },
  } = useTasks();
  const [kind, setKind] = useState<"board" | "folder">("board");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      if (kind === "folder") {
        await createFolder(name.trim());
      } else {
        await createBoard(name.trim(), folderId || null);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog title="Create board or folder" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Type">
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as "board" | "folder")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="folder">Folder</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        {kind === "board" && folders.length > 0 ? (
          <Field label="Folder">
            <Select
              value={folderId || "root"}
              onValueChange={(value) =>
                setFolderId(value === "root" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function NameDialog({
  title,
  initialName,
  onClose,
  onSubmit,
}: {
  title: string;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function MoveBoardDialog({
  board,
  folders,
  onClose,
  onSubmit,
}: {
  board: TaskBoard;
  folders: Folder[];
  onClose: () => void;
  onSubmit: (folderId: string | null) => Promise<unknown>;
}) {
  const [folderId, setFolderId] = useState(board.folderId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(folderId || null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog title={`Move "${board.name}"`} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Folder">
          <Select
            value={folderId || "root"}
            onValueChange={(value) =>
              setFolderId(value === "root" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Root</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Move
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

type SpaceDialog =
  | { kind: "renameBoard"; board: TaskBoard }
  | { kind: "moveBoard"; board: TaskBoard }
  | { kind: "deleteBoard"; board: TaskBoard }
  | { kind: "renameFolder"; folder: Folder }
  | { kind: "deleteFolder"; folder: Folder }
  | null;

interface SpaceDialogsContextValue {
  openRenameBoard: (board: TaskBoard) => void;
  openMoveBoard: (board: TaskBoard) => void;
  openDeleteBoard: (board: TaskBoard) => void;
  openRenameFolder: (folder: Folder) => void;
  openDeleteFolder: (folder: Folder) => void;
}

interface SpaceDialogsHostProps {
  dialog: SpaceDialog;
  onClose: () => void;
}
