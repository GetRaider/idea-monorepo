"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
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
import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  ChevronIcon,
  PlusIcon,
  RowsIcon,
  SettingsIcon,
  SortIcon,
} from "@components/icons";

import { boardCollisionDetection, type BoardDropData } from "./task-board-dnd";
import {
  BoardDropZone,
  BoardGlyph,
  StatusGlyph,
  TaskRow,
  TaskSearchField,
  TasksBreadcrumb,
} from "./task-board.ui";
import { useBoardPreferences } from "./board-preferences-provider";
import {
  useCollapsedScheduleBoards,
  type BoardListSubmode,
  type BoardViewMode,
} from "./task-board-preferences";
import { ScheduleBoards } from "./schedule-boards";
import {
  BoardAxes,
  ProgressStageSettings,
  StageNameProvider,
  useBoardAxes,
} from "./board-axes";
import { TaskComposer, type TaskComposerValues } from "./task-composer";
import { TaskKanban } from "./task-kanban";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  statusAfterDoneToggle,
  filterStatusGroups,
  isoToDateInput,
  localDayScheduleQuery,
  resolveCombinedOpenDrop,
  sameBoardDropIndex,
  scheduleBoards,
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
      createBoardId,
      view,
      selectedBoard,
      boards,
      search,
      tasks,
    },
    actions: {
      createTask,
      updateTask,
      updateTaskStatus,
      moveTask,
      openCreateDialog,
    },
    meta: { createInputRef },
  } = useTasks();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerBoardId, setComposerBoardId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const boardDetail = useBoardAxes(
    view.kind === "board" ? (selectedBoard?.id ?? null) : null,
  );
  const boardAreas = boardDetail.data?.areas ?? [];
  const selectedAreaId =
    boardAreas.find((area) => area.id === areaFilter)?.id ??
    boardAreas.find((area) => area.isDefault)?.id ??
    null;
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
  const scheduleContextKey =
    view.kind === "schedule" ? `schedule:${view.schedule}` : null;
  const { collapsedBoardIds, toggleBoardCollapsed } =
    useCollapsedScheduleBoards(scheduleContextKey);
  const visibleGroups = useMemo(() => {
    if (view.kind !== "board") return groups;
    if (!selectedAreaId) {
      return {
        [TaskStatus.TODO]: [],
        [TaskStatus.IN_PROGRESS]: [],
        [TaskStatus.DONE]: [],
        [TaskStatus.CANCELLED]: [],
      };
    }
    return filterStatusGroups(groups, selectedAreaId);
  }, [groups, selectedAreaId, view.kind]);
  const sortedGroups = useMemo(
    () => sortGroupsByListSort(visibleGroups, listSort),
    [listSort, visibleGroups],
  );
  const scheduleSections = useMemo(() => {
    if (view.kind !== "schedule") return [];
    const roots = STATUS_ORDER.flatMap((status) => groups[status] ?? []);
    return scheduleBoards(boards, roots).map((section) => ({
      ...section,
      groups:
        viewMode === "list"
          ? sortGroupsByListSort(section.groups, listSort)
          : section.groups,
    }));
  }, [boards, groups, listSort, view.kind, viewMode]);
  const title =
    view.kind === "schedule"
      ? view.schedule === "today"
        ? "Today"
        : "Tomorrow"
      : (selectedBoard?.name ?? "Select a board");
  const scheduleDayInput =
    view.kind === "schedule"
      ? isoToDateInput(
          localDayScheduleQuery(view.schedule === "today" ? 0 : 1).scheduleFrom,
        )
      : "";

  const reorderEnabled =
    (view.kind === "board" || view.kind === "schedule") &&
    !search.trim() &&
    (viewMode === "kanban" || !listSort.enabled);
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const drop = event.over?.data.current as BoardDropData | undefined;
    if (!drop || drop.type !== "reorder") return;
    const task = tasks.find((item) => item.id === String(event.active.id));
    if (!task || task.parentTaskId) return;
    if (drop.boardId && drop.boardId !== task.taskBoardId) {
      updateTask(
        task.id,
        { taskBoardId: drop.boardId, status: drop.status },
        { quiet: true },
      );
      return;
    }
    const columnNodes = (status: Task["status"]) => {
      const nodes = visibleGroups[status] ?? [];
      if (!drop.boardId) return nodes;
      return nodes.filter((node) => node.taskBoardId === drop.boardId);
    };
    if (!reorderEnabled || drop.index == null) {
      if (task.status === drop.status) return;
      moveTask(task.id, { status: drop.status });
      return;
    }
    const resolved = drop.combinedOpen
      ? resolveCombinedOpenDrop(
          columnNodes(TaskStatus.TODO),
          columnNodes(TaskStatus.IN_PROGRESS),
          task.id,
          task.taskBoardId,
          drop.index,
        )
      : {
          status: drop.status,
          index: sameBoardDropIndex(
            columnNodes(drop.status),
            task.id,
            task.taskBoardId,
            drop.index,
          ),
        };
    const currentIndex = (visibleGroups[task.status] ?? [])
      .filter((node) => node.taskBoardId === task.taskBoardId)
      .findIndex((node) => node.id === task.id);
    if (resolved.status === task.status && resolved.index === currentIndex) {
      return;
    }
    moveTask(task.id, resolved);
  };

  const showEmptySchedule =
    view.kind === "schedule" && scheduleSections.length === 0 && !search.trim();
  const isBoard = view.kind === "board";
  const hasVisibleTasks = STATUS_ORDER.some(
    (status) => (sortedGroups[status] ?? []).length > 0,
  );

  useEffect(() => {
    setAreaFilter(null);
  }, [selectedBoard?.id]);

  useEffect(() => {
    if (!isComposerOpen && !composerBoardId) return;
    createInputRef.current?.focus();
  }, [composerBoardId, createInputRef, isComposerOpen, viewMode]);

  function openComposer() {
    setIsComposerOpen(true);
  }

  function closeComposer() {
    setIsComposerOpen(false);
    setComposerBoardId(null);
  }

  function submitComposer(values: TaskComposerValues, boardId?: string) {
    createTask(values.summary, null, {
      status: values.status,
      priority: values.priority,
      estimation: values.estimation,
      taskBoardId: boardId ?? values.taskBoardId ?? undefined,
      areaId: selectedAreaId ?? undefined,
      scheduleDate: values.scheduleDate,
      dueDate: values.dueDate,
    });
    closeComposer();
  }

  function fastCreateFor(boardId: string) {
    return {
      isOpen: composerBoardId === boardId,
      titleRef: composerBoardId === boardId ? createInputRef : undefined,
      defaultBoardId: boardId,
      defaultScheduleDate: scheduleDayInput,
      onOpen: () => setComposerBoardId(boardId),
      onClose: () =>
        setComposerBoardId((current) => (current === boardId ? null : current)),
      onCreate: (values: TaskComposerValues) => submitComposer(values, boardId),
    };
  }

  function createSubtask(parentTaskId: string) {
    const parent = tasks.find((item) => item.id === parentTaskId);
    if (!parent) return;
    createTask("New subtask", parentTaskId, {
      estimation: parent.estimation,
      areaId: parent.areaId,
      progressStageId: parent.progressStageId,
    });
  }

  function toggleDone(task: NestedTask) {
    updateTaskStatus(task.id, statusAfterDoneToggle(task.status));
  }

  function renderBoardSurface() {
    if (view.kind === "schedule") {
      return (
        <ScheduleBoards
          sections={scheduleSections}
          collapsedBoardIds={collapsedBoardIds}
          onToggleBoard={toggleBoardCollapsed}
          renderBoard={(section) =>
            viewMode === "kanban" ? (
              <TaskKanban
                groups={section.groups}
                boardNameById={boardNameById}
                showBoardName={false}
                reorderEnabled={reorderEnabled}
                boardId={section.board.id}
                layout="stack"
                fastCreate={fastCreateFor(section.board.id)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <ListSections
                  submode={listSubmode}
                  groups={section.groups}
                  listSort={listSort}
                  boardNameById={boardNameById}
                  showBoardName={false}
                  boardId={section.board.id}
                  fastCreate={fastCreateFor(section.board.id)}
                  onToggleDone={toggleDone}
                  onCreateSubtask={createSubtask}
                  reorderEnabled={reorderEnabled}
                />
              </div>
            )
          }
        />
      );
    }
    if (viewMode === "kanban") {
      return (
        <TaskKanban
          groups={visibleGroups}
          boardNameById={boardNameById}
          showBoardName={false}
          reorderEnabled={reorderEnabled}
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
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <ListSections
          submode={listSubmode}
          groups={sortedGroups}
          listSort={listSort}
          boardNameById={boardNameById}
          showBoardName={false}
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
          onToggleDone={toggleDone}
          onCreateSubtask={createSubtask}
          reorderEnabled={reorderEnabled}
        />
      </div>
    );
  }

  const stageBoardIds = useMemo(
    () => [...new Set(tasks.map((task) => task.taskBoardId))],
    [tasks],
  );

  return (
    <StageNameProvider boardIds={stageBoardIds}>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <TasksBreadcrumb
              className="text-2xl font-semibold tracking-tight"
              boardName={title}
              trailing={view.kind === "board" ? <BoardGlyph /> : null}
            />
            {isBoard && selectedBoard ? (
              <BoardAxes
                boardId={selectedBoard.id}
                areaId={selectedAreaId}
                onAreaId={setAreaFilter}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <ViewModeSwitch
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <TaskSearchField />
            <ViewSettingsMenu
              boardId={isBoard ? selectedBoard?.id : null}
              listSubmode={listSubmode}
              listSort={listSort}
              onListSubmodeChange={setListSubmode}
              onListSortChange={setListSort}
            />
            <Button
              size="sm"
              onClick={() => {
                if (view.kind === "schedule") {
                  const boardId = scheduleSections[0]?.board.id;
                  if (!boardId) return;
                  if (collapsedBoardIds.has(boardId)) {
                    toggleBoardCollapsed(boardId);
                  }
                  setComposerBoardId(boardId);
                  return;
                }
                openComposer();
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
            collisionDetection={boardCollisionDetection}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            autoScroll={{ threshold: { x: 0, y: 0.15 } }}
            onDragStart={handleDragStart}
            onDragCancel={() => setActiveTaskId(null)}
            onDragEnd={handleDragEnd}
          >
            {renderBoardSurface()}
            <DragOverlay dropAnimation={null}>
              {activeTask ? (
                <div className="cursor-grabbing rounded-md border border-border bg-panel px-3 py-2 text-sm shadow-lg">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">
                    {activeTask.taskKey}
                  </span>
                  {activeTask.summary}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>
    </StageNameProvider>
  );
}

function ListSections({
  submode,
  groups,
  listSort,
  boardNameById,
  showBoardName,
  boardId,
  fastCreate,
  onToggleDone,
  onCreateSubtask,
  reorderEnabled,
}: {
  submode: BoardListSubmode;
  groups: Record<Task["status"], NestedTask[]>;
  listSort: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  };
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  boardId?: string;
  fastCreate?: ListFastCreate;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  reorderEnabled: boolean;
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
          {
            key: "cancelled",
            label: "Cancelled",
            status: TaskStatus.CANCELLED,
            nodes: groups[TaskStatus.CANCELLED] ?? [],
          },
        ]
      : STATUS_ORDER.map((status) => ({
          key: status,
          label: STATUS_LABEL[status],
          status,
          nodes: groups[status] ?? [],
        }));

  const {
    actions: { clearTaskSelection },
  } = useTasks();

  return (
    <div
      data-task-surface=""
      className="flex flex-col gap-3"
      onClick={(event) => {
        if (!(event.target instanceof Element)) return;
        if (
          event.target.closest(
            "[data-task-id], input, textarea, button, a, [contenteditable='true']",
          )
        ) {
          return;
        }
        clearTaskSelection();
      }}
    >
      {sections.map((section) => (
        <ListSection
          key={section.key}
          label={section.label}
          status={section.status}
          nodes={section.nodes}
          defaultOpen={
            section.status !== TaskStatus.DONE &&
            section.status !== TaskStatus.CANCELLED
          }
          boardNameById={boardNameById}
          showBoardName={showBoardName}
          boardId={boardId}
          fastCreate={
            section.status === TaskStatus.TODO ? fastCreate : undefined
          }
          onToggleDone={onToggleDone}
          onCreateSubtask={onCreateSubtask}
          reorderEnabled={reorderEnabled}
          combinedOpen={
            submode === "single" && section.status === TaskStatus.TODO
          }
        />
      ))}
    </div>
  );
}

function ListSection({
  label,
  status,
  nodes,
  defaultOpen,
  boardNameById,
  showBoardName,
  boardId,
  fastCreate,
  onToggleDone,
  onCreateSubtask,
  reorderEnabled,
  combinedOpen,
}: {
  label: string;
  status: Task["status"];
  nodes: NestedTask[];
  defaultOpen: boolean;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  boardId?: string;
  fastCreate?: ListFastCreate;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  reorderEnabled: boolean;
  combinedOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionHeader = (
    <>
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
    </>
  );
  const trigger = (
    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold hover:bg-surface">
      {sectionHeader}
    </CollapsibleTrigger>
  );
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="shrink-0 rounded-lg border border-border bg-panel px-2 py-1">
        {open ? (
          trigger
        ) : (
          <BoardDropZone
            kind="column"
            status={status}
            index={reorderEnabled ? nodes.length : null}
            boardId={boardId}
            combinedOpen={combinedOpen}
          >
            {trigger}
          </BoardDropZone>
        )}
        {fastCreate ? (
          <div className="mb-2 px-1">
            <TaskComposer
              titleRef={fastCreate.titleRef}
              defaultBoardId={fastCreate.defaultBoardId}
              defaultScheduleDate={fastCreate.defaultScheduleDate}
              open={fastCreate.isOpen}
              onOpenChange={(next) =>
                next ? fastCreate.onOpen() : fastCreate.onClose()
              }
              onCreate={fastCreate.onCreate}
            />
          </div>
        ) : null}
        <CollapsibleContent>
          {reorderEnabled ? (
            nodes.length === 0 ? (
              <BoardDropZone
                kind="empty"
                status={status}
                index={0}
                boardId={boardId}
                combinedOpen={combinedOpen}
                compact
              >
                <p className="px-8 py-2 text-sm text-muted-foreground">
                  No tasks
                </p>
              </BoardDropZone>
            ) : (
              <div>
                {nodes.map((node, index) => (
                  <div key={node.id}>
                    <BoardDropZone
                      kind="gap"
                      status={status}
                      index={index}
                      boardId={boardId}
                      combinedOpen={combinedOpen}
                      compact
                    />
                    <BoardDropZone
                      kind="card"
                      status={status}
                      index={index}
                      boardId={boardId}
                      combinedOpen={combinedOpen}
                    >
                      <TaskTree
                        nodes={[node]}
                        boardNameById={boardNameById}
                        showBoardName={showBoardName}
                        boardId={boardId}
                        onToggleDone={onToggleDone}
                        onCreateSubtask={onCreateSubtask}
                      />
                    </BoardDropZone>
                  </div>
                ))}
                <BoardDropZone
                  kind="fill"
                  status={status}
                  index={nodes.length}
                  boardId={boardId}
                  combinedOpen={combinedOpen}
                  compact
                />
              </div>
            )
          ) : nodes.length === 0 ? (
            <BoardDropZone
              kind="empty"
              status={status}
              index={null}
              boardId={boardId}
              combinedOpen={combinedOpen}
              compact
            >
              <p className="px-8 py-2 text-sm text-muted-foreground">
                No tasks
              </p>
            </BoardDropZone>
          ) : (
            <TaskTree
              nodes={nodes}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
              boardId={boardId}
              statusDrop
              onToggleDone={onToggleDone}
              onCreateSubtask={onCreateSubtask}
            />
          )}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function TaskTree({
  nodes,
  boardNameById,
  showBoardName,
  boardId,
  onToggleDone,
  onCreateSubtask,
  statusDrop = false,
  depth = 0,
}: {
  nodes: NestedTask[];
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  boardId?: string;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  statusDrop?: boolean;
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
            boardNameById={boardNameById}
            showBoardName={showBoardName}
            boardId={boardId}
            depth={depth}
            expanded={expandedIds.has(node.id)}
            onToggleExpanded={() => toggleExpanded(node.id)}
            onToggleDone={onToggleDone}
            onCreateSubtask={onCreateSubtask}
            statusDrop={statusDrop && depth === 0}
          />
          {node.children.length > 0 && expandedIds.has(node.id) ? (
            <TaskTree
              nodes={node.children}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
              boardId={boardId}
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

const SORT_FIELD_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "schedule", label: "Schedule" },
  { value: "priority", label: "Priority" },
] as const satisfies ReadonlyArray<SettingsOption<ListSortField>>;

const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const satisfies ReadonlyArray<SettingsOption<"asc" | "desc">>;

function ViewSettingsMenu({
  boardId,
  listSubmode,
  listSort,
  onListSubmodeChange,
  onListSortChange,
}: ViewSettingsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Board view settings"
        >
          <SettingsIcon size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-xl border-border bg-panel p-1.5 shadow-lg"
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest("[data-board-settings-select]")
          ) {
            event.preventDefault();
          }
        }}
      >
        <SettingsRow
          icon={<RowsIcon size={16} />}
          label="Layout"
          control={
            <SettingsChoice
              label={listSubmode === "grouped" ? "Grouped" : "Single"}
              onClick={() =>
                onListSubmodeChange(
                  listSubmode === "grouped" ? "single" : "grouped",
                )
              }
            />
          }
        />
        <SettingsRow
          icon={<SortIcon size={16} />}
          label="Sort"
          control={
            <SettingsChoice
              label={listSort.enabled ? "On" : "Off"}
              pressed={listSort.enabled}
              onClick={() =>
                onListSortChange({ ...listSort, enabled: !listSort.enabled })
              }
            />
          }
        />
        <div className="mx-2 my-1 h-px bg-border" />
        <SettingsRow
          icon={<SortIcon size={16} />}
          label="Sort by"
          control={
            <SettingsSelect
              value={listSort.field}
              disabled={!listSort.enabled}
              options={SORT_FIELD_OPTIONS}
              onValueChange={(field) =>
                onListSortChange({ ...listSort, field })
              }
            />
          }
        />
        <SettingsRow
          icon={<ChevronIcon size={16} className="rotate-90" />}
          label="Order"
          control={
            <SettingsSelect
              value={listSort.direction}
              disabled={!listSort.enabled}
              options={SORT_DIRECTION_OPTIONS}
              onValueChange={(direction) =>
                onListSortChange({ ...listSort, direction })
              }
            />
          }
        />
        {boardId ? (
          <>
            <div className="mx-2 my-1 h-px bg-border" />
            <ProgressStageSettings boardId={boardId} />
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function SettingsRow({ icon, label, control }: SettingsRowProps) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1 text-sm text-foreground">{label}</span>
      {control}
    </div>
  );
}

function SettingsChoice({
  label,
  pressed = false,
  onClick,
}: SettingsChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "h-8 min-w-[4.75rem] rounded-md border border-border px-3 text-sm text-foreground",
        "hover:bg-surface",
        pressed && "bg-surface",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SettingsSelect<Value extends string>({
  value,
  disabled,
  options,
  onValueChange,
}: SettingsSelectProps<Value>) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onValueChange(next as Value)}
    >
      <SelectTrigger className="h-8 w-[8.25rem] rounded-md border-border bg-transparent px-2.5 text-sm shadow-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent data-board-settings-select="" className="rounded-lg">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
        if (
          nativeEvent.shiftKey ||
          nativeEvent.metaKey ||
          nativeEvent.ctrlKey
        ) {
          return false;
        }
        const target = nativeEvent.target;
        if (
          target instanceof Element &&
          target.closest(
            "input, textarea, select, option, a, [contenteditable='true'], [data-no-dnd]",
          )
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}

interface ViewSettingsMenuProps {
  boardId?: string | null;
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
}

interface SettingsRowProps {
  icon: ReactNode;
  label: string;
  control: ReactNode;
}

interface SettingsChoiceProps {
  label: string;
  pressed?: boolean;
  onClick: () => void;
}

interface SettingsOption<Value extends string> {
  value: Value;
  label: string;
}

interface SettingsSelectProps<Value extends string> {
  value: Value;
  disabled: boolean;
  options: ReadonlyArray<SettingsOption<Value>>;
  onValueChange: (value: Value) => void;
}

interface ListFastCreate {
  isOpen: boolean;
  titleRef: ComponentProps<"input">["ref"];
  defaultBoardId?: string;
  defaultScheduleDate?: string;
  onOpen: () => void;
  onClose: () => void;
  onCreate: (values: TaskComposerValues) => void;
}
