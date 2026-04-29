"use client";

import Image from "next/image";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  InfoCircleIcon,
  ListBoardIcon,
  PublicWorkspaceIcon,
  SingleListIcon,
  SortIcon,
  ViewIcon,
} from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { Switch } from "@/components/Switch/Switch";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { OptionToggleButton } from "@/components/OptionToggleButton/OptionToggleButton";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { clientServices } from "@/services";
import { toast } from "sonner";
import type { BoardViewMode } from "@/hooks/tasks/useBoardViewMode";
import type { BoardListSubmode } from "@/hooks/tasks/useBoardListSubmode";
import type {
  ListSortDirection,
  ListSortField,
  ListSortState,
} from "@/helpers/list-sort.helper";

import { PopoverContainer, Popover, SettingsButton } from "../KanbanBoard.ui";
import { cn } from "@/lib/styles/utils";

export interface WorkspaceSettingsProps {
  /** When provided, the "Public Workspace" toggle is rendered for this board. */
  boardId?: string;
  viewMode: BoardViewMode;
  onViewModeChange: (next: BoardViewMode) => void;
  listSubmode?: BoardListSubmode;
  onListSubmodeChange?: (next: BoardListSubmode) => void;
  /** When provided, a sort row is rendered (visible only in List view). */
  sort?: ListSortState;
  onSortChange?: (next: ListSortState) => void;
}

const SORT_FIELD_OPTIONS: { label: string; value: ListSortField }[] = [
  { label: "Title", value: "title" },
  { label: "Schedule", value: "schedule" },
  { label: "Priority", value: "priority" },
];

const SORT_DIRECTION_OPTIONS: { label: string; value: ListSortDirection }[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

export function WorkspaceSettings({
  boardId,
  viewMode,
  onViewModeChange,
  listSubmode,
  onListSubmodeChange,
  sort,
  onSortChange,
}: WorkspaceSettingsProps) {
  const isAnonymous = useIsAnonymous();
  const { taskBoards, setTaskBoards } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingPublic, setIsSavingPublic] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isPublic = useMemo(
    () =>
      boardId
        ? (taskBoards.find((entry) => entry.id === boardId)?.isPublic ?? false)
        : false,
    [taskBoards, boardId],
  );

  useEffect(() => {
    if (!settingsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (popoverRef.current?.contains(target)) return;
      // The Dropdown menu is rendered to a body portal, so its DOM is outside the
      // popover. Treat clicks inside any dropdown portal as inside the settings.
      if (
        target instanceof Element &&
        target.closest("[data-dropdown-portal]")
      ) {
        return;
      }
      setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [settingsOpen]);

  const handlePublicToggle = useCallback(
    async (toPublic: boolean) => {
      if (!boardId || isSavingPublic) return;
      setIsSavingPublic(true);
      try {
        const board = taskBoards.find((entry) => entry.id === boardId);
        if (isAnonymous && !board) {
          toast.error("Board not loaded");
          return;
        }
        const updated = await clientServices.taskBoards.changeVisibility({
          id: boardId,
          toPublic: toPublic,
          boardSnapshot: board,
          skipCascade: isAnonymous,
        });
        if (!updated) {
          toast.error("Can't update workspace visibility");
          return;
        }
        setTaskBoards((previous) =>
          previous.map((entry) => (entry.id === boardId ? updated : entry)),
        );
      } finally {
        setIsSavingPublic(false);
      }
    },
    [boardId, isSavingPublic, setTaskBoards, taskBoards, isAnonymous],
  );

  const showPublicToggle = !!boardId;

  return (
    <PopoverContainer ref={popoverRef}>
      <SettingsButton
        type="button"
        title="Board settings"
        aria-expanded={settingsOpen}
        aria-haspopup="dialog"
        onClick={() => setSettingsOpen((previous) => !previous)}
      >
        <Image src="/board-preference.svg" alt="" width={20} height={20} />
      </SettingsButton>
      {settingsOpen ? (
        <Popover
          role="dialog"
          aria-label="Manage settings"
          className="w-[min(100vw-2rem,420px)] rounded-2xl border-border-app bg-background-primary p-6 text-text-primary shadow-dropdown"
        >
          <header className="border-b border-border-app pb-4">
            <h2 className="m-0 text-lg font-semibold leading-tight text-text-primary">
              Board Settings
            </h2>
            <p className="mt-1.5 m-0 text-sm leading-snug text-text-secondary">
              Manage settings for this board.
            </p>
          </header>

          <ul className="m-0 list-none divide-y divide-border-app p-0">
            <BoardViewSettingRow
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />

            {viewMode === "list" && listSubmode && onListSubmodeChange ? (
              <SettingRow
                labelId="workspace-single-list-label"
                label="Single List"
                icon={
                  <SingleListIcon size={20} className="text-text-primary" />
                }
                tooltip="One list for active work and one for done; change status per row."
                checked={listSubmode === "single"}
                onChange={(enabled) =>
                  onListSubmodeChange(enabled ? "single" : "grouped")
                }
              />
            ) : null}

            {sort && onSortChange ? (
              <SortSettingRow sort={sort} onSortChange={onSortChange} />
            ) : null}

            {showPublicToggle ? (
              <SettingRow
                labelId="workspace-public-label"
                label="Public Workspace"
                icon={
                  <PublicWorkspaceIcon
                    size={20}
                    className="text-text-primary"
                  />
                }
                tooltip="Guests can use this board without signing in."
                checked={isPublic}
                disabled={isAnonymous || isSavingPublic}
                onChange={(toPublic) => void handlePublicToggle(toPublic)}
              />
            ) : null}
          </ul>
        </Popover>
      ) : null}
    </PopoverContainer>
  );
}

interface SettingRowProps {
  labelId: string;
  label: string;
  icon: ReactNode;
  tooltip: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  children?: ReactNode;
}

function SettingRow({
  labelId,
  label,
  icon,
  tooltip,
  checked,
  disabled,
  onChange,
  children,
}: SettingRowProps) {
  return (
    <li className="flex items-center gap-4 py-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-input-bg"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            id={labelId}
            className="text-sm font-semibold text-text-primary"
          >
            {label}
          </span>
          <AppTooltip content={tooltip}>
            <button
              type="button"
              className="inline-flex shrink-0 cursor-help items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              aria-label={`About ${label.toLowerCase()}`}
            >
              <InfoCircleIcon size={14} />
            </button>
          </AppTooltip>
        </div>
        {children}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        size="sm"
        aria-labelledby={labelId}
      />
    </li>
  );
}

function BoardViewSettingRow({
  viewMode,
  onViewModeChange,
}: {
  viewMode: BoardViewMode;
  onViewModeChange: (next: BoardViewMode) => void;
}) {
  return (
    <li className="flex items-start gap-4 py-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-input-bg"
        aria-hidden
      >
        <ViewIcon size={20} className="text-text-primary" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            id="workspace-view-label"
            className="text-sm font-semibold text-text-primary"
          >
            View
          </span>
          <AppTooltip content="Kanban uses columns by status. List is a compact row layout.">
            <button
              type="button"
              className="inline-flex shrink-0 cursor-help items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              aria-label="About board view"
            >
              <InfoCircleIcon size={14} />
            </button>
          </AppTooltip>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="workspace-view-label"
          className="grid grid-cols-2 gap-2"
        >
          <OptionToggleButton
            role="radio"
            aria-checked={viewMode === "kanban"}
            isSelected={viewMode === "kanban"}
            size="compact"
            className="w-full"
            onClick={() => onViewModeChange("kanban")}
            icon={
              <Image src="/kanban-board.svg" alt="" width={14} height={14} />
            }
          >
            Kanban
          </OptionToggleButton>
          <OptionToggleButton
            role="radio"
            aria-checked={viewMode === "list"}
            isSelected={viewMode === "list"}
            size="compact"
            className="w-full"
            onClick={() => onViewModeChange("list")}
            icon={<ListBoardIcon size={14} />}
          >
            List
          </OptionToggleButton>
        </div>
      </div>
    </li>
  );
}

interface SortSettingRowProps {
  sort: ListSortState;
  onSortChange: (next: ListSortState) => void;
}

function SortSettingRow({ sort, onSortChange }: SortSettingRowProps) {
  return (
    <li className="flex items-start gap-4 py-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-input-bg"
        aria-hidden
      >
        <SortIcon size={20} className="text-text-primary" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            id="workspace-sort-label"
            className="text-sm font-semibold text-text-primary"
          >
            Sort Tasks
          </span>
          <AppTooltip content="When on, tasks follow the sort below in Kanban and List.">
            <button
              type="button"
              className="inline-flex shrink-0 cursor-help items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              aria-label="About sort tasks"
            >
              <InfoCircleIcon size={14} />
            </button>
          </AppTooltip>
        </div>
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 transition-opacity",
            !sort.enabled && "pointer-events-none opacity-40",
          )}
          aria-disabled={!sort.enabled}
        >
          <Dropdown<ListSortField>
            options={SORT_FIELD_OPTIONS}
            value={sort.field}
            onChange={(field) => onSortChange({ ...sort, field })}
            menuMinWidth={140}
          />
          <Dropdown<ListSortDirection>
            options={SORT_DIRECTION_OPTIONS}
            value={sort.direction}
            onChange={(direction) => onSortChange({ ...sort, direction })}
            menuMinWidth={140}
          />
        </div>
      </div>
      <Switch
        checked={sort.enabled}
        onCheckedChange={(enabled) => onSortChange({ ...sort, enabled })}
        size="sm"
        aria-labelledby="workspace-sort-label"
      />
    </li>
  );
}
