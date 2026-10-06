"use client";

import { createContext, use, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import { PROGRESS_STAGE_TEMPLATES, ProgressStageTemplate } from "@repo/api/todex";
import type { BoardArea, BoardProgressStage } from "@repo/api/todex";

import { PlusIcon } from "@components/icons";
import { todexClient } from "@lib/todex-client";

const EMPTY_STAGE_NAMES = new Map<string, string>();
const StageNameContext = createContext(EMPTY_STAGE_NAMES);

export function BoardAxes({
  boardId,
  areaId,
  onAreaId,
}: {
  boardId: string;
  areaId: string | null;
  onAreaId: (areaId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => todexClient.boards.get(boardId),
  });
  const areas = boardQuery.data?.areas ?? [];
  const defaultAreaId = areas.find((area) => area.isDefault)?.id ?? null;
  const [renamingAreaId, setRenamingAreaId] = useState<string | null>(null);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["board", boardId] });
  };

  const createArea = useMutation({
    mutationFn: (name: string) =>
      todexClient.boards.createArea(boardId, { name }),
    onSuccess: (area) => {
      invalidate();
      onAreaId(area.id);
    },
    onError: () => toast.error("Could not add area"),
  });
  const renameArea = useMutation({
    mutationFn: (input: { areaId: string; name: string }) =>
      todexClient.boards.updateArea(boardId, input.areaId, { name: input.name }),
    onSuccess: () => {
      invalidate();
      setRenamingAreaId(null);
    },
    onError: () => toast.error("Could not rename area"),
  });
  const removeArea = useMutation({
    mutationFn: (nextAreaId: string) =>
      todexClient.boards.removeArea(boardId, nextAreaId),
    onSuccess: (_result, nextAreaId) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (areaId === nextAreaId) onAreaId(defaultAreaId);
    },
    onError: () => toast.error("Could not delete area"),
  });

  return (
    <div className="flex flex-wrap items-center gap-1">
      {areas.map((area) =>
        renamingAreaId === area.id ? (
          <NameForm
            key={area.id}
            label={`Rename ${area.name}`}
            placeholder="Area name"
            initialValue={area.name}
            pending={renameArea.isPending}
            startOpen
            onSubmit={(name) => renameArea.mutate({ areaId: area.id, name })}
            onClose={() => setRenamingAreaId(null)}
          />
        ) : (
          <span key={area.id} className="inline-flex items-center">
            <AxisChip
              active={areaId === area.id}
              onClick={() => onAreaId(area.id)}
            >
              {area.name}
            </AxisChip>
            {area.isDefault ? null : (
              <AreaMenu
                area={area}
                onRename={() => setRenamingAreaId(area.id)}
                onDelete={() => removeArea.mutate(area.id)}
              />
            )}
          </span>
        ),
      )}
      <NameForm
        label="Add area"
        placeholder="Area name"
        pending={createArea.isPending}
        onSubmit={(name) => createArea.mutate(name)}
      />
    </div>
  );
}

export function ProgressStageSettings({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => todexClient.boards.get(boardId),
  });
  const stages = boardQuery.data?.progressStages ?? [];
  const [creating, setCreating] = useState(false);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };
  const replaceStages = useMutation({
    mutationFn: (next: Array<{ id?: string; name: string }>) =>
      todexClient.boards.replaceProgressStages(boardId, { stages: next }),
    onSuccess: () => {
      invalidate();
      setCreating(false);
    },
    onError: () => toast.error("Could not update stages"),
  });
  const applyFounder = useMutation({
    mutationFn: () =>
      todexClient.boards.applyProgressStageTemplate(boardId, {
        template: ProgressStageTemplate.FOUNDER,
      }),
    onSuccess: () => {
      invalidate();
      setCreating(false);
    },
    onError: () => toast.error("Could not apply stages"),
  });
  const mode = stageMode(stages, creating);

  function selectMode(next: StageMode) {
    if (next === "none") {
      setCreating(false);
      if (stages.length > 0) replaceStages.mutate([]);
      return;
    }
    if (next === "founder") {
      setCreating(false);
      if (!isFounderTemplate(stages)) applyFounder.mutate();
      return;
    }
    setCreating(true);
  }

  return (
    <div className="px-2.5 py-2">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 text-sm text-foreground">
          Progress Stages
        </span>
        <Select
          value={mode}
          onValueChange={(value) => selectMode(value as StageMode)}
        >
          <SelectTrigger
            aria-label="Progress stages"
            className="h-8 w-[8.25rem] rounded-md border-border bg-transparent px-2.5 text-sm shadow-none focus:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-board-settings-select="" className="rounded-lg">
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="founder">Founder</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === "none" ? null : (
        <div className="mt-2 flex flex-col gap-1">
          {stages.map((stage) => (
            <StageRow
              key={`${stage.id}:${stage.name}`}
              stage={stage}
              onRename={(name) =>
                replaceStages.mutate(
                  stages.map((item) =>
                    item.id === stage.id
                      ? { id: item.id, name }
                      : { id: item.id, name: item.name },
                  ),
                )
              }
              onDelete={() =>
                replaceStages.mutate(
                  stages
                    .filter((item) => item.id !== stage.id)
                    .map((item) => ({ id: item.id, name: item.name })),
                )
              }
            />
          ))}
          {creating || stages.length > 0 ? (
            <NameForm
              label="Add stage"
              placeholder="Stage name"
              pending={replaceStages.isPending}
              startOpen={creating && stages.length === 0}
              onSubmit={(name) =>
                replaceStages.mutate([
                  ...stages.map((stage) => ({ id: stage.id, name: stage.name })),
                  { name },
                ])
              }
              onClose={() => setCreating(false)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function StageNameProvider({
  boardIds,
  children,
}: {
  boardIds: string[];
  children: ReactNode;
}) {
  const names = useStageNames(boardIds);
  return <StageNameContext value={names}>{children}</StageNameContext>;
}

export function useStageName(progressStageId: string | null): string | null {
  const names = use(StageNameContext);
  if (!progressStageId) return null;
  return names.get(progressStageId) ?? null;
}

export function useBoardAxes(boardId: string | null) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => todexClient.boards.get(boardId!),
    enabled: !!boardId,
  });
}

function useStageNames(boardIds: string[]) {
  const uniqueBoardIds = [...new Set(boardIds)].sort();
  const boards = useQueries({
    queries: uniqueBoardIds.map((boardId) => ({
      queryKey: ["board", boardId],
      queryFn: () => todexClient.boards.get(boardId),
    })),
  });
  const names = new Map<string, string>();
  for (const board of boards) {
    for (const stage of board.data?.progressStages ?? []) {
      names.set(stage.id, stage.name);
    }
  }
  return names;
}

function AreaMenu({
  area,
  onRename,
  onDelete,
}: {
  area: BoardArea;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Edit ${area.name}`}
        className="flex h-7 w-5 items-center justify-center text-xs text-muted-foreground hover:text-foreground"
      >
        ···
      </PopoverTrigger>
      <PopoverContent align="start" className="w-32 p-1">
        <button
          type="button"
          className="flex h-8 w-full items-center rounded-md px-2 text-sm hover:bg-surface"
          onClick={() => {
            setOpen(false);
            onRename();
          }}
        >
          Rename
        </button>
        <button
          type="button"
          className="flex h-8 w-full items-center rounded-md px-2 text-sm hover:bg-surface"
          onClick={() => {
            setOpen(false);
            onDelete();
          }}
        >
          Delete
        </button>
      </PopoverContent>
    </Popover>
  );
}

function StageRow({
  stage,
  onRename,
  onDelete,
}: {
  stage: BoardProgressStage;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        defaultValue={stage.name}
        aria-label={`Rename ${stage.name}`}
        className="h-7 min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 text-sm outline-none"
        onBlur={(event) => {
          const name = event.target.value.trim();
          if (name && name !== stage.name) onRename(name);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <button
        type="button"
        className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

function AxisChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-7 rounded-md px-2 text-sm",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NameForm({
  label,
  placeholder,
  pending,
  initialValue = "",
  startOpen = false,
  onSubmit,
  onClose,
}: {
  label: string;
  placeholder: string;
  pending: boolean;
  initialValue?: string;
  startOpen?: boolean;
  onSubmit: (name: string) => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const [name, setName] = useState(initialValue);

  function close() {
    setName("");
    setOpen(false);
    onClose?.();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label={label}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <PlusIcon size={14} />
      </button>
    );
  }

  return (
    <form onSubmit={submit}>
      <input
        autoFocus
        value={name}
        disabled={pending}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-7 w-32 rounded-md border border-border bg-transparent px-2 text-sm outline-none"
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          if (startOpen || name.trim()) return;
          close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      />
    </form>
  );
}

function stageMode(stages: BoardProgressStage[], creating: boolean): StageMode {
  if (stages.length === 0) return creating ? "custom" : "none";
  if (creating) return "custom";
  if (isFounderTemplate(stages)) return "founder";
  return "custom";
}

function isFounderTemplate(stages: BoardProgressStage[]) {
  const template = PROGRESS_STAGE_TEMPLATES.founder;
  return (
    stages.length === template.length &&
    stages.every((stage, index) => stage.name === template[index])
  );
}

type StageMode = "none" | "founder" | "custom";
