"use client";

import { useEffect, useMemo, useState, type ComponentProps, type FormEvent } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { ChevronIcon, PlusIcon, SettingsIcon } from "@components/icons";

import {
  BoardGlyph,
  StatusDroppable,
  StatusGlyph,
  TaskRow,
  TaskSearchField,
  TasksBreadcrumb,
  parseStatusDroppableId,
} from "./task-board.ui";
import { useBoardPreferences } from "./board-preferences-provider";
import type { BoardListSubmode, BoardViewMode } from "./task-board-preferences";
import { TaskComposer, type TaskComposerValues } from "./task-composer";
import { TaskKanban } from "./task-kanban";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  sortGroupsByListSort,
  sortNestedTasks,
  type ListSortField,
  type NestedTask,
} from "./task-helpers";
import { useTasks } from "./tasks-provider";

export function TaskList() {
  const {
    state: {
      groups,
      selectedTaskId,
      createBoardId,
      view,
      selectedBoard,
      boards,
      search,
      tasks,
    },
    actions: {
      setSelectedTaskId,
      createTask,
      updateTaskStatus,
      setScheduleTargetBoardId,
      openCreateDialog,
    },
    meta: { createInputRef },
  } = useTasks();
  const [createSummary, setCreateSummary] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const {
    viewMode,
    listSubmode,
    listSort,
    setViewMode,
    setListSubmode,
    setListSort,
  } = useBoardPreferences();
  const sensors = useSensors(
    useSensor(BoardPointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const boardNameById = new Map(boards.map((board) => [board.id, board.name]));
  const sortedGroups = useMemo(
    () => sortGroupsByListSort(groups, listSort),
    [groups, listSort],
  );
  const hasScheduledTasks = STATUS_ORDER.some(
    (status) => (groups[status] ?? []).length > 0,
  );
  const title =
    view.kind === "schedule"
      ? view.schedule === "today"
        ? "Today"
        : "Tomorrow"
      : (selectedBoard?.name ?? "Select a board");
  const showBoardName = view.kind === "schedule";

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!createSummary.trim() || !createBoardId) return;
    createTask(createSummary.trim());
    setCreateSummary("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    if (overId == null) return;
    const columnStatus = parseStatusDroppableId(overId);
    const overTask = tasks.find((item) => item.id === String(overId));
    const nextStatus = columnStatus ?? overTask?.status ?? null;
    const taskId = String(event.active.id);
    const task = tasks.find((item) => item.id === taskId);
    if (!nextStatus || !task || task.status === nextStatus) return;
    updateTaskStatus(taskId, nextStatus);
  };

  const showEmptySchedule =
    view.kind === "schedule" && !hasScheduledTasks && !search.trim();
  const isBoard = view.kind === "board";
  const hasVisibleTasks = STATUS_ORDER.some(
    (status) => (sortedGroups[status] ?? []).length > 0,
  );

  useEffect(() => {
    if (!isComposerOpen) return;
    createInputRef.current?.focus();
  }, [createInputRef, isComposerOpen, viewMode]);

  function openComposer() {
    setIsComposerOpen(true);
  }

  function closeComposer() {
    setIsComposerOpen(false);
  }

  function submitComposer(values: TaskComposerValues) {
    createTask(values.summary, null, {
      status: values.status,
      priority: values.priority,
      estimation: values.estimation,
      taskBoardId: values.taskBoardId ?? undefined,
      scheduleDate: values.scheduleDate,
      dueDate: values.dueDate,
    });
    closeComposer();
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      <div className="mb-6 flex items-center justify-between gap-4">
        <TasksBreadcrumb
          className="text-2xl font-semibold tracking-tight"
          boardName={title}
          trailing={view.kind === "board" ? <BoardGlyph /> : null}
        />
        <div className="flex items-center gap-2">
          <ViewModeSwitch viewMode={viewMode} onViewModeChange={setViewMode} />
          <TaskSearchField />
          <ViewSettingsMenu
            listSubmode={listSubmode}
            listSort={listSort}
            onListSubmodeChange={setListSubmode}
            onListSortChange={setListSort}
          />
          <Button
            size="sm"
            onClick={() => {
              if (isBoard) {
                openComposer();
                return;
              }
              createInputRef.current?.focus();
            }}
            disabled={!createBoardId}
          >
            <PlusIcon size={16} />
            New Task
          </Button>
        </div>
      </div>
      {view.kind === "schedule" && boards.length === 0 ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
          <span>Create a board to schedule tasks.</span>
          <Button size="sm" onClick={openCreateDialog}>
            Create board
          </Button>
        </div>
      ) : null}
      {view.kind === "schedule" ? (
        <form
          onSubmit={submitCreate}
          className="mb-3 flex items-center gap-2"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Select
            value={createBoardId ?? undefined}
            onValueChange={setScheduleTargetBoardId}
            disabled={boards.length === 0}
          >
            <SelectTrigger className="h-9 w-44 shrink-0">
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={createInputRef}
            value={createSummary}
            onChange={(event) => setCreateSummary(event.target.value)}
            placeholder="+ Create a new task"
            disabled={!createBoardId}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </form>
      ) : null}
      {search.trim() && !hasVisibleTasks && !showEmptySchedule ? (
        <p className="mb-3 text-sm text-muted-foreground">
          No tasks match “{search.trim()}”.
        </p>
      ) : null}
      {showEmptySchedule ? (
        <p className="px-2 py-8 text-center text-sm text-muted-foreground">
          Nothing scheduled
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          {viewMode === "kanban" ? (
            <TaskKanban
              groups={groups}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
              fastCreate={
                isBoard
                  ? {
                      isOpen: isComposerOpen,
                      titleRef: createInputRef,
                      onOpen: openComposer,
                      onClose: closeComposer,
                      onCreate: submitComposer,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <ListSections
                submode={listSubmode}
                groups={sortedGroups}
                listSort={listSort}
                selectedTaskId={selectedTaskId}
                boardNameById={boardNameById}
                showBoardName={showBoardName}
                fastCreate={
                  isBoard
                    ? {
                        isOpen: isComposerOpen,
                        titleRef: createInputRef,
                        onOpen: openComposer,
                        onClose: closeComposer,
                        onCreate: submitComposer,
                      }
                    : undefined
                }
                onSelect={setSelectedTaskId}
                onToggleDone={(task) =>
                  updateTaskStatus(
                    task.id,
                    task.status === TaskStatus.DONE
                      ? TaskStatus.TODO
                      : TaskStatus.DONE,
                  )
                }
                onCreateSubtask={(parentTaskId) =>
                  createTask("New subtask", parentTaskId)
                }
              />
            </div>
          )}
        </DndContext>
      )}
    </section>
  );
}

function ListSections({
  submode,
  groups,
  listSort,
  selectedTaskId,
  boardNameById,
  showBoardName,
  fastCreate,
  onSelect,
  onToggleDone,
  onCreateSubtask,
}: {
  submode: BoardListSubmode;
  groups: Record<Task["status"], NestedTask[]>;
  listSort: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  };
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  fastCreate?: ListFastCreate;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
}) {
  const sections =
    submode === "single"
      ? [
          {
            key: "tasks",
            label: "Tasks",
            status: TaskStatus.TODO,
            nodes: sortNestedTasks(
              [
                ...(groups[TaskStatus.TODO] ?? []),
                ...(groups[TaskStatus.IN_PROGRESS] ?? []),
              ],
              listSort,
            ),
          },
          {
            key: "done",
            label: "Done",
            status: TaskStatus.DONE,
            nodes: groups[TaskStatus.DONE] ?? [],
          },
        ]
      : STATUS_ORDER.map((status) => ({
          key: status,
          label: STATUS_LABEL[status],
          status,
          nodes: groups[status] ?? [],
        }));

  return (
    <>
      {sections.map((section) => (
        <ListSection
          key={section.key}
          label={section.label}
          status={section.status}
          nodes={section.nodes}
          defaultOpen={section.status !== TaskStatus.DONE}
          selectedTaskId={selectedTaskId}
          boardNameById={boardNameById}
          showBoardName={showBoardName}
          fastCreate={
            section.status === TaskStatus.TODO ? fastCreate : undefined
          }
          onSelect={onSelect}
          onToggleDone={onToggleDone}
          onCreateSubtask={onCreateSubtask}
        />
      ))}
    </>
  );
}

function ListSection({
  label,
  status,
  nodes,
  defaultOpen,
  selectedTaskId,
  boardNameById,
  showBoardName,
  fastCreate,
  onSelect,
  onToggleDone,
  onCreateSubtask,
}: {
  label: string;
  status: Task["status"];
  nodes: NestedTask[];
  defaultOpen: boolean;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  fastCreate?: ListFastCreate;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="rounded-lg border border-border bg-panel px-2 py-1">
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold hover:bg-surface">
          <ChevronIcon
            size={14}
            className={cn(
              "text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
          <StatusGlyph status={status} />
          <span>{label}</span>
          <span className="text-muted-foreground">{nodes.length}</span>
        </CollapsibleTrigger>
        {fastCreate ? (
          <div className="mb-2 px-1">
            <TaskComposer
              titleRef={fastCreate.titleRef}
              open={fastCreate.isOpen}
              onOpenChange={(next) =>
                next ? fastCreate.onOpen() : fastCreate.onClose()
              }
              onCreate={fastCreate.onCreate}
            />
          </div>
        ) : null}
        <CollapsibleContent>
          <StatusDroppable status={status} className="min-h-8">
            {nodes.length === 0 ? (
              <p className="px-8 py-2 text-sm text-muted-foreground">
                No tasks
              </p>
            ) : (
              <TaskTree
                nodes={nodes}
                selectedTaskId={selectedTaskId}
                boardNameById={boardNameById}
                showBoardName={showBoardName}
                onSelect={onSelect}
                onToggleDone={onToggleDone}
                onCreateSubtask={onCreateSubtask}
              />
            )}
          </StatusDroppable>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function TaskTree({
  nodes,
  selectedTaskId,
  boardNameById,
  showBoardName,
  onSelect,
  onToggleDone,
  onCreateSubtask,
  depth = 0,
}: {
  nodes: NestedTask[];
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  depth?: number;
}) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  function toggleExpanded(taskId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          <TaskRow
            node={node}
            selectedTaskId={selectedTaskId}
            boardNameById={boardNameById}
            showBoardName={showBoardName}
            depth={depth}
            expanded={expandedIds.has(node.id)}
            onToggleExpanded={() => toggleExpanded(node.id)}
            onSelect={onSelect}
            onToggleDone={onToggleDone}
            onCreateSubtask={onCreateSubtask}
          />
          {node.children.length > 0 && expandedIds.has(node.id) ? (
            <TaskTree
              nodes={node.children}
              selectedTaskId={selectedTaskId}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
              onSelect={onSelect}
              onToggleDone={onToggleDone}
              onCreateSubtask={onCreateSubtask}
              depth={depth + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ViewSettingsMenu({
  listSubmode,
  listSort,
  onListSubmodeChange,
  onListSortChange,
}: {
  listSubmode: BoardListSubmode;
  listSort: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  };
  onListSubmodeChange: (next: BoardListSubmode) => void;
  onListSortChange: (next: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  }) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Board view settings"
        >
          <SettingsIcon size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>List layout</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={listSubmode}
              onValueChange={(value) =>
                onListSubmodeChange(value as BoardListSubmode)
              }
            >
              <DropdownMenuRadioItem value="grouped">
                Grouped
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="single">
                Single list
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={listSort.enabled}
              onCheckedChange={(enabled) =>
                onListSortChange({ ...listSort, enabled: Boolean(enabled) })
              }
            >
              Enabled
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup
              value={listSort.field}
              onValueChange={(value) =>
                onListSortChange({
                  ...listSort,
                  field: value as ListSortField,
                })
              }
            >
              <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="schedule">
                Schedule
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority">
                Priority
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuRadioGroup
              value={listSort.direction}
              onValueChange={(value) =>
                onListSortChange({
                  ...listSort,
                  direction: value as "asc" | "desc",
                })
              }
            >
              <DropdownMenuRadioItem value="asc">
                Ascending
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">
                Descending
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewModeSwitch({
  viewMode,
  onViewModeChange,
}: {
  viewMode: BoardViewMode;
  onViewModeChange: (next: BoardViewMode) => void;
}) {
  return (
    <div className="flex h-9 items-center rounded-md border border-border p-0.5">
      {(["kanban", "list"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={viewMode === mode}
          className={cn(
            "h-8 rounded px-2.5 text-sm",
            viewMode === mode
              ? "bg-surface text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onViewModeChange(mode)}
        >
          {mode === "kanban" ? "Kanban" : "List"}
        </button>
      ))}
    </div>
  );
}

class BoardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false;
        const target = nativeEvent.target;
        if (
          target instanceof Element &&
          target.closest(
            "input, textarea, select, option, button, a, [contenteditable='true']",
          )
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}

interface ListFastCreate {
  isOpen: boolean;
  titleRef: ComponentProps<"input">["ref"];
  onOpen: () => void;
  onClose: () => void;
  onCreate: (values: TaskComposerValues) => void;
}
