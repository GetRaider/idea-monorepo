"use client";

import {
  createContext,
  use,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
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
import type { Space, SpaceFolder } from "@repo/api/todex";
import { DEFAULT_SPACE_COLOR } from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";

import { SpaceColorPicker } from "./space-color-picker";
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
        openRenameSpaceFolder: (folder) =>
          setDialog({ kind: "renameSpaceFolder", folder }),
        openDeleteSpaceFolder: (folder) =>
          setDialog({ kind: "deleteSpaceFolder", folder }),
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
      <RenameSpaceDialog
        board={dialog.board}
        onClose={onClose}
        onSubmit={(body) => updateBoard(dialog.board.id, body)}
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
      <DeleteSpaceDialog
        board={dialog.board}
        onClose={onClose}
        onConfirm={() => removeBoard(dialog.board.id)}
      />
    );
  }

  if (dialog?.kind === "renameSpaceFolder") {
    return (
      <NameDialog
        title="Rename folder"
        initialName={dialog.folder.name}
        onClose={onClose}
        onSubmit={(name) => updateFolder(dialog.folder.id, { name })}
      />
    );
  }

  if (dialog?.kind === "deleteSpaceFolder") {
    return (
      <ConfirmDialog
        title="Delete folder"
        description={`Delete folder "${dialog.folder.name}"? Spaces inside it stay and have no folder.`}
        confirmLabel="Delete"
        onClose={onClose}
        onConfirm={() => removeFolder(dialog.folder.id)}
      />
    );
  }

  return null;
}

function DeleteSpaceDialog({
  board,
  onClose,
  onConfirm,
}: {
  board: Space;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const previewQuery = useQuery({
    queryKey: ["space-deletion", board.id],
    queryFn: () => todexClient.spaces.deletionPreview(board.id),
  });
  const preview = previewQuery.data;
  const counts = preview
    ? `${preview.tasks} tasks, ${preview.goals} goals, ${preview.documents} documents, ${preview.epics} epics, ${preview.docFolders} document folders, ${preview.sessionCount} sessions`
    : "its tasks, goals, documents, epics, and document folders";

  return (
    <ConfirmDialog
      title="Delete space"
      description={`Delete space "${board.name}" and ${counts}? Calendar events and templates stay and lose this space.`}
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function CreateSpaceDialog({
  onClose,
  folders,
}: {
  onClose: () => void;
  folders: SpaceFolder[];
}) {
  const {
    actions: { createFolder, createBoard },
  } = useTasks();
  const [kind, setKind] = useState<"board" | "folder">("board");
  const [name, setName] = useState("");
  const [color, setColor] = useState<Space["color"]>(DEFAULT_SPACE_COLOR);
  const [folderId, setSpaceFolderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      if (kind === "folder") {
        await createFolder(name.trim());
      } else {
        await createBoard(name.trim(), folderId || null, color);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog title="Create space or folder" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Type">
          <div className="flex gap-2">
            {(["board", "folder"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={kind === option}
                className={`h-9 flex-1 rounded-md border text-sm ${
                  kind === option
                    ? "border-foreground bg-surface text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setKind(option)}
              >
                {option === "board" ? "Space" : "Folder"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Name">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full bg-[var(--todex-swatch)]"
              style={{ ["--todex-swatch" as string]: color }}
            />
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </Field>
        {kind === "board" ? (
          <Field label="Color">
            <SpaceColorPicker value={color} onChange={setColor} />
          </Field>
        ) : null}
        {kind === "board" ? (
          <Field label="Folder">
            <Select
              value={folderId || "root"}
              onValueChange={(value) =>
                setSpaceFolderId(value === "root" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[5000]">
                <SelectItem value="root">No Folder</SelectItem>
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

function RenameSpaceDialog({
  board,
  onClose,
  onSubmit,
}: {
  board: Space;
  onClose: () => void;
  onSubmit: (body: { name: string; color: Space["color"] }) => Promise<Space>;
}) {
  const [name, setName] = useState(board.name);
  const [color, setColor] = useState<Space["color"]>(board.color);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog title="Rename space" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          setIsSubmitting(true);
          void onSubmit({ name: name.trim(), color }).finally(() => {
            setIsSubmitting(false);
            onClose();
          });
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 shrink-0 rounded-full bg-[var(--todex-swatch)]"
            style={{ ["--todex-swatch" as string]: color }}
          />
          <Input
            autoFocus
            aria-label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <SpaceColorPicker value={color} onChange={setColor} />
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
  board: Space;
  folders: SpaceFolder[];
  onClose: () => void;
  onSubmit: (folderId: string | null) => Promise<unknown>;
}) {
  const [folderId, setSpaceFolderId] = useState(board.folderId ?? "");
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
              setSpaceFolderId(value === "root" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[5000]">
              <SelectItem value="root">No Folder</SelectItem>
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
  | { kind: "renameBoard"; board: Space }
  | { kind: "moveBoard"; board: Space }
  | { kind: "deleteBoard"; board: Space }
  | { kind: "renameSpaceFolder"; folder: SpaceFolder }
  | { kind: "deleteSpaceFolder"; folder: SpaceFolder }
  | null;

interface SpaceDialogsContextValue {
  openRenameBoard: (board: Space) => void;
  openMoveBoard: (board: Space) => void;
  openDeleteBoard: (board: Space) => void;
  openRenameSpaceFolder: (folder: SpaceFolder) => void;
  openDeleteSpaceFolder: (folder: SpaceFolder) => void;
}

interface SpaceDialogsHostProps {
  dialog: SpaceDialog;
  onClose: () => void;
}
