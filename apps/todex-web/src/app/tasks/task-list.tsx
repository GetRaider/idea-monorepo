"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
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

import {
  ChevronIcon,
  PlusIcon,
  SettingsIcon,
} from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import {
  BoardGlyph,
  StatusDroppable,
  StatusGlyph,
  TaskRow,
  parseStatusDroppableId,
} from "./task-board.ui";
import {
  useTaskBoardPreferences,
  type BoardListSubmode,
  type BoardViewMode,
} from "./task-board-preferences";
import { QuickCreateTaskRow } from "./quick-create-task-row";
import { TaskCommand } from "./task-command";
import { requestQuickCreateTask } from "./task-create-events";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  localDayScheduleQuery,
  sortGroupsByListSort,
  sortNestedTasks,
  type ListSortField,
  type NestedTask,
} from "./task-helpers";
import { KanbanCardView, TaskKanban } from "./task-kanban";
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
      tasks,
    },
    actions: {
      setSelectedTaskId,
      createTask,
      updateTask,
      updateTaskStatus,
      setScheduleTargetBoardId,
      openCreateDialog,
    },
    meta: { createInputRef },
  } = useTasks();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const contextKey =
    view.kind === "board"
      ? view.boardId
      : view.kind === "schedule"
        ? `schedule:${view.schedule}`
        : null;
  const {
    viewMode,
    listSubmode,
    listSort,
    setViewMode,
    setListSubmode,
    setListSort,
  } = useTaskBoardPreferences(contextKey);
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
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

  const showEmptySchedule = view.kind === "schedule" && !hasScheduledTasks;
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;
  const quickCreate = (
    <QuickCreateTaskRow
      disabled={!createBoardId}
      inputRef={createInputRef}
      defaultScheduleDate={
        view.kind === "schedule"
          ? localDayScheduleQuery(view.schedule === "today" ? 0 : 1)
              .scheduleFrom
          : null
      }
      onCreate={(input) => createTask(input)}
      leading={
        view.kind === "schedule" ? (
          <Select
            value={createBoardId ?? undefined}
            onValueChange={setScheduleTargetBoardId}
            disabled={boards.length === 0}
          >
            <SelectTrigger className="h-8 w-36 shrink-0">
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
        ) : null
      }
    />
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight">
          <Link
            href={tasksUrlHelper.routing.buildRootUrl()}
            className="text-muted-foreground hover:text-foreground"
          >
            Tasks
          </Link>
          <span className="text-muted-foreground">›</span>
          <span className="flex min-w-0 items-center gap-2 truncate">
            {view.kind === "board" ? <BoardGlyph /> : null}
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TaskCommand />
          <ViewSettingsMenu
            viewMode={viewMode}
            listSubmode={listSubmode}
            listSort={listSort}
            onViewModeChange={setViewMode}
            onListSubmodeChange={setListSubmode}
            onListSortChange={setListSort}
          />
          <Button
            size="sm"
            onClick={requestQuickCreateTask}
            disabled={!createBoardId}
          >
            <PlusIcon size={16} />
            Create Task
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
      {showEmptySchedule ? (
        <p className="mb-3 text-sm text-muted-foreground">Nothing scheduled</p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        {viewMode === "kanban" ? (
          <TaskKanban
            groups={groups}
            boardNameById={boardNameById}
            showBoardName={showBoardName}
            todoTopSlot={quickCreate}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-xl border border-border bg-panel p-3">
            <ListSections
              submode={listSubmode}
              groups={sortedGroups}
              listSort={listSort}
              selectedTaskId={selectedTaskId}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
              createSlot={quickCreate}
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
                  createTask({
                    summary: "New subtask",
                    parentTaskId,
                  })
                }
              onPriorityChange={(taskId, priority) =>
                updateTask(taskId, { priority }, { optimistic: true })
              }
              onScheduleChange={(taskId, scheduleDate) =>
                updateTask(taskId, { scheduleDate }, { optimistic: true })
              }
            />
          </div>
        )}
        <DragOverlay>
          {activeTask ? (
            viewMode === "kanban" ? (
              <KanbanCardView
                node={{ ...activeTask, children: [] }}
                boardNameById={boardNameById}
                showBoardName={showBoardName}
                className="cursor-grabbing shadow-lg"
              />
            ) : (
              <ListDragPreview
                taskKey={activeTask.taskKey}
                summary={activeTask.summary}
              />
            )
          ) : null}
        </DragOverlay>
      </DndContext>
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
  createSlot,
  onSelect,
  onToggleDone,
  onCreateSubtask,
  onPriorityChange,
  onScheduleChange,
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
  createSlot: ReactNode;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
  onScheduleChange: (taskId: string, scheduleDate: string | null) => void;
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
          createSlot={
            section.status === TaskStatus.TODO ? createSlot : undefined
          }
          selectedTaskId={selectedTaskId}
          boardNameById={boardNameById}
          showBoardName={showBoardName}
          onSelect={onSelect}
          onToggleDone={onToggleDone}
          onCreateSubtask={onCreateSubtask}
          onPriorityChange={onPriorityChange}
          onScheduleChange={onScheduleChange}
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
  createSlot,
  selectedTaskId,
  boardNameById,
  showBoardName,
  onSelect,
  onToggleDone,
  onCreateSubtask,
  onPriorityChange,
  onScheduleChange,
}: {
  label: string;
  status: Task["status"];
  nodes: NestedTask[];
  defaultOpen: boolean;
  createSlot?: ReactNode;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
  onScheduleChange: (taskId: string, scheduleDate: string | null) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="border-b border-border py-1 last:border-b-0">
        <CollapsibleTrigger className="flex items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold hover:bg-white/[0.04]">
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
        <CollapsibleContent>
          <StatusDroppable status={status} className="min-h-8">
            {createSlot ? <div className="px-1 pb-2">{createSlot}</div> : null}
            {nodes.length === 0 ? (
              <p className="px-8 py-2 text-sm text-muted-foreground">
                No tasks
              </p>
            ) : (
              <ul>
                {nodes.map((node) => (
                  <TaskRow
                    key={node.id}
                    node={node}
                    selectedTaskId={selectedTaskId}
                    boardNameById={boardNameById}
                    showBoardName={showBoardName}
                    onSelect={onSelect}
                    onToggleDone={onToggleDone}
                    onCreateSubtask={onCreateSubtask}
                    onPriorityChange={onPriorityChange}
                    onScheduleChange={onScheduleChange}
                  />
                ))}
              </ul>
            )}
          </StatusDroppable>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function ViewSettingsMenu({
  viewMode,
  listSubmode,
  listSort,
  onViewModeChange,
  onListSubmodeChange,
  onListSortChange,
}: {
  viewMode: BoardViewMode;
  listSubmode: BoardListSubmode;
  listSort: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  };
  onViewModeChange: (next: BoardViewMode) => void;
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
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as BoardViewMode)}
        >
          <DropdownMenuRadioItem value="kanban">Kanban</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {viewMode === "list" ? (
          <>
            <DropdownMenuSeparator />
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
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ListDragPreview({
  taskKey,
  summary,
}: {
  taskKey: string;
  summary: string;
}) {
  return (
    <div className="grid min-w-[560px] grid-cols-[minmax(0,1fr)_minmax(6.5rem,7.5rem)] items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 shadow-lg">
      <div className="min-w-0 text-sm">
        <span className="mr-2 font-mono text-xs text-muted-foreground">
          {taskKey}
        </span>
        <span>{summary}</span>
      </div>
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
