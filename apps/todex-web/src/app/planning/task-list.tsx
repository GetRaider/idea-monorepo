"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  RowsIcon,
  SettingsIcon,
  SortIcon,
} from "@components/icons";
import { NewButton } from "@components/new-button";

import { todexClient } from "@/lib/todex-client";

import { boardCollisionDetection, type BoardDropData } from "./task-board-dnd";
import {
  BoardDropZone,
  BoardGlyph,
  StatusGlyph,
  TaskRow,
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
import { EpicRows } from "./epic-row";
import { TaskKanban } from "./task-kanban";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  statusAfterDoneToggle,
  columnsWithEpics,
  filterStatusGroups,
  isoToDateInput,
  localDayScheduleQuery,
  resolveCombinedOpenDrop,
  sameBoardDropIndex,
  scheduleBoards,
  sortGroupsByListSort,
  sortNestedTasks,
  type EpicColumn,
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
  const [showEpics, setShowEpics] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerBoardId, setComposerBoardId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const boardDetail = useBoardAxes(
    view.kind === "board" ? (selectedBoard?.id ?? null) : null,
  );
  const spaceSections = boardDetail.data?.sections ?? [];
  const selectedAreaId =
    spaceSections.find((area) => area.id === areaFilter)?.id ??
    spaceSections.find((area) => area.isDefault)?.id ??
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
  const spaceNameById = new Map(boards.map((board) => [board.id, board.name]));
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
  const queryClient = useQueryClient();
  const spaceId = view.kind === "board" ? selectedBoard?.id : undefined;
  const epicsQuery = useQuery({
    queryKey: ["epics", spaceId],
    queryFn: () => todexClient.epics.list(spaceId ?? ""),
    enabled: Boolean(spaceId),
  });
  const epicColumns = useMemo(() => {
    if (!spaceId) return null;
    const roots = STATUS_ORDER.flatMap((status) => sortedGroups[status] ?? []);
    const sectionEpics = (epicsQuery.data ?? []).filter(
      (epic) => epic.sectionId === selectedAreaId,
    );
    return columnsWithEpics(roots, sectionEpics, showEpics, showTasks);
  }, [
    epicsQuery.data,
    selectedAreaId,
    showEpics,
    showTasks,
    sortedGroups,
    spaceId,
  ]);
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
      : (selectedBoard?.name ?? "Select a space");
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
  const draggingEpicId = activeTaskId?.startsWith("epic:")
    ? activeTaskId.slice("epic:".length)
    : null;
  const draggingEpic =
    epicsQuery.data?.find((epic) => epic.id === draggingEpicId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const drop = event.over?.data.current as BoardDropData | undefined;
    if (!drop || drop.type !== "reorder") return;
    const activeId = String(event.active.id);
    if (activeId.startsWith("epic:")) {
      const epicId = activeId.slice("epic:".length);
      const epic = epicsQuery.data?.find((item) => item.id === epicId);
      if (!epic || epic.status === drop.status) return;
      void todexClient.epics
        .update(epicId, { status: drop.status })
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: ["epics", epic.spaceId],
          });
          void queryClient.invalidateQueries({ queryKey: ["epic", epicId] });
        });
      return;
    }
    const task = tasks.find((item) => item.id === activeId);
    if (drop.kind === "epic" && drop.epicId) {
      if (!task || task.parentTaskId) return;
      if (drop.spaceId && drop.spaceId !== task.spaceId) return;
      if (task.epicId === drop.epicId) return;
      updateTask(task.id, { epicId: drop.epicId }, { quiet: true });
      return;
    }
    if (!task || task.parentTaskId) return;
    if (drop.spaceId && drop.spaceId !== task.spaceId) {
      updateTask(
        task.id,
        { spaceId: drop.spaceId, status: drop.status },
        { quiet: true },
      );
      return;
    }
    const columnNodes = (status: Task["status"]) => {
      const nodes = epicColumns
        ? epicColumns[status].tasks
        : (visibleGroups[status] ?? []);
      if (!drop.spaceId) return nodes;
      return nodes.filter((node) => node.spaceId === drop.spaceId);
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
          task.spaceId,
          drop.index,
        )
      : {
          status: drop.status,
          index: sameBoardDropIndex(
            columnNodes(drop.status),
            task.id,
            task.spaceId,
            drop.index,
          ),
        };
    const currentIndex = (
      epicColumns
        ? epicColumns[task.status].tasks
        : (visibleGroups[task.status] ?? [])
    )
      .filter((node) => node.spaceId === task.spaceId)
      .findIndex((node) => node.id === task.id);
    if (resolved.status === task.status && resolved.index === currentIndex) {
      return;
    }
    moveTask(task.id, resolved);
  };

  const showEmptySchedule =
    view.kind === "schedule" && scheduleSections.length === 0 && !search.trim();
  const isBoard = view.kind === "board";
  const hasVisibleTasks = epicColumns
    ? STATUS_ORDER.some(
        (status) =>
          epicColumns[status].epics.length > 0 ||
          epicColumns[status].tasks.length > 0,
      )
    : STATUS_ORDER.some((status) => (sortedGroups[status] ?? []).length > 0);

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

  function submitComposer(values: TaskComposerValues, spaceId?: string) {
    createTask(values.summary, null, {
      status: values.status,
      priority: values.priority,
      estimation: values.estimation,
      spaceId: spaceId ?? values.spaceId ?? undefined,
      sectionId: selectedAreaId ?? undefined,
      scheduleDate: values.scheduleDate,
      dueDate: values.dueDate,
    });
    closeComposer();
  }

  function fastCreateFor(spaceId: string) {
    return {
      isOpen: composerBoardId === spaceId,
      titleRef: composerBoardId === spaceId ? createInputRef : undefined,
      defaultBoardId: spaceId,
      defaultScheduleDate: scheduleDayInput,
      onOpen: () => setComposerBoardId(spaceId),
      onClose: () =>
        setComposerBoardId((current) => (current === spaceId ? null : current)),
      onCreate: (values: TaskComposerValues) => submitComposer(values, spaceId),
    };
  }

  function createSubtask(parentTaskId: string) {
    const parent = tasks.find((item) => item.id === parentTaskId);
    if (!parent) return;
    createTask("New subtask", parentTaskId, {
      estimation: parent.estimation,
      sectionId: parent.sectionId,
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
                spaceNameById={spaceNameById}
                showBoardName={false}
                reorderEnabled={reorderEnabled}
                spaceId={section.board.id}
                layout="stack"
                fastCreate={fastCreateFor(section.board.id)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <ListSections
                  submode={listSubmode}
                  groups={section.groups}
                  listSort={listSort}
                  spaceNameById={spaceNameById}
                  showBoardName={false}
                  spaceId={section.board.id}
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
          groups={
            epicColumns
              ? {
                  [TaskStatus.TODO]: epicColumns[TaskStatus.TODO].tasks,
                  [TaskStatus.IN_PROGRESS]:
                    epicColumns[TaskStatus.IN_PROGRESS].tasks,
                  [TaskStatus.DONE]: epicColumns[TaskStatus.DONE].tasks,
                  [TaskStatus.CANCELLED]:
                    epicColumns[TaskStatus.CANCELLED].tasks,
                }
              : visibleGroups
          }
          epicColumns={epicColumns}
          spaceName={selectedBoard?.name}
          spaceId={selectedBoard?.id}
          allowEpicTasks={showTasks}
          spaceNameById={spaceNameById}
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
          epicColumns={epicColumns}
          spaceName={selectedBoard?.name}
          allowEpicTasks={showTasks}
          listSort={listSort}
          spaceNameById={spaceNameById}
          showBoardName={false}
          spaceId={selectedBoard?.id}
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
    () => [...new Set(tasks.map((task) => task.spaceId))],
    [tasks],
  );

  return (
    <StageNameProvider spaceIds={stageBoardIds}>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <TasksBreadcrumb
              className="text-2xl font-semibold tracking-tight"
              spaceName={title}
              trailing={view.kind === "board" ? <BoardGlyph /> : null}
            />
            {isBoard && selectedBoard ? (
              <BoardAxes
                spaceId={selectedBoard.id}
                sectionId={selectedAreaId}
                onAreaId={setAreaFilter}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <ViewModeSwitch
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <ViewSettingsMenu
              spaceId={isBoard ? selectedBoard?.id : null}
              listSubmode={listSubmode}
              listSort={listSort}
              onListSubmodeChange={setListSubmode}
              onListSortChange={setListSort}
              showEpics={spaceId ? showEpics : undefined}
              showTasks={spaceId ? showTasks : undefined}
              onShowEpicsChange={setShowEpics}
              onShowTasksChange={setShowTasks}
            />
            <NewButton
              onClick={() => {
                if (view.kind === "schedule") {
                  const spaceId = scheduleSections[0]?.board.id;
                  if (!spaceId) return;
                  if (collapsedBoardIds.has(spaceId)) {
                    toggleBoardCollapsed(spaceId);
                  }
                  setComposerBoardId(spaceId);
                  return;
                }
                openComposer();
              }}
              disabled={!createBoardId}
            />
          </div>
        </div>
        {view.kind === "schedule" && boards.length === 0 ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
            <span>Create a space to schedule tasks.</span>
            <Button size="sm" onClick={openCreateDialog}>
              Create space
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
              ) : draggingEpic ? (
                <div className="cursor-grabbing rounded-md border border-border bg-panel px-3 py-2 text-sm shadow-lg">
                  {draggingEpic.name}
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
  epicColumns,
  spaceName,
  allowEpicTasks = true,
  listSort,
  spaceNameById,
  showBoardName,
  spaceId,
  fastCreate,
  onToggleDone,
  onCreateSubtask,
  reorderEnabled,
}: {
  submode: BoardListSubmode;
  groups: Record<Task["status"], NestedTask[]>;
  epicColumns?: Record<
    Task["status"],
    { epics: EpicColumn[]; tasks: NestedTask[] }
  > | null;
  spaceName?: string;
  allowEpicTasks?: boolean;
  listSort: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  };
  spaceNameById: Map<string, string>;
  showBoardName: boolean;
  spaceId?: string;
  fastCreate?: ListFastCreate;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  reorderEnabled: boolean;
}) {
  function tasksFor(statuses: Task["status"][]) {
    return statuses.flatMap((status) =>
      epicColumns ? epicColumns[status].tasks : (groups[status] ?? []),
    );
  }
  function epicsFor(statuses: Task["status"][]) {
    return statuses.flatMap((status) =>
      epicColumns ? epicColumns[status].epics : [],
    );
  }
  const sections =
    submode === "single"
      ? [
          {
            key: "tasks",
            label: "Tasks",
            status: TaskStatus.TODO,
            nodes: sortNestedTasks(
              tasksFor([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
              listSort,
            ),
            epics: epicsFor([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
          },
          {
            key: "done",
            label: "Done",
            status: TaskStatus.DONE,
            nodes: tasksFor([TaskStatus.DONE]),
            epics: epicsFor([TaskStatus.DONE]),
          },
          {
            key: "cancelled",
            label: "Cancelled",
            status: TaskStatus.CANCELLED,
            nodes: tasksFor([TaskStatus.CANCELLED]),
            epics: epicsFor([TaskStatus.CANCELLED]),
          },
        ]
      : STATUS_ORDER.map((status) => ({
          key: status,
          label: STATUS_LABEL[status],
          status,
          nodes: tasksFor([status]),
          epics: epicsFor([status]),
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
          epics={section.epics}
          spaceName={spaceName}
          allowEpicTasks={allowEpicTasks}
          defaultOpen={
            section.status !== TaskStatus.DONE &&
            section.status !== TaskStatus.CANCELLED
          }
          spaceNameById={spaceNameById}
          showBoardName={showBoardName}
          spaceId={spaceId}
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
  epics = [],
  spaceName,
  allowEpicTasks = true,
  defaultOpen,
  spaceNameById,
  showBoardName,
  spaceId,
  fastCreate,
  onToggleDone,
  onCreateSubtask,
  reorderEnabled,
  combinedOpen,
}: {
  label: string;
  status: Task["status"];
  nodes: NestedTask[];
  epics?: EpicColumn[];
  spaceName?: string;
  allowEpicTasks?: boolean;
  defaultOpen: boolean;
  spaceNameById: Map<string, string>;
  showBoardName: boolean;
  spaceId?: string;
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
      <span className="text-muted-foreground">
        {nodes.length + epics.length}
      </span>
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
            spaceId={spaceId}
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
          {spaceId && spaceName && epics.length > 0 ? (
            <EpicRows
              rows={epics}
              spaceName={spaceName}
              spaceId={spaceId}
              allowTasks={allowEpicTasks}
            />
          ) : null}
          {reorderEnabled ? (
            nodes.length === 0 && epics.length === 0 ? (
              <BoardDropZone
                kind="empty"
                status={status}
                index={0}
                spaceId={spaceId}
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
                      spaceId={spaceId}
                      combinedOpen={combinedOpen}
                      compact
                    />
                    <BoardDropZone
                      kind="card"
                      status={status}
                      index={index}
                      spaceId={spaceId}
                      combinedOpen={combinedOpen}
                    >
                      <TaskTree
                        nodes={[node]}
                        spaceNameById={spaceNameById}
                        showBoardName={showBoardName}
                        spaceId={spaceId}
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
                  spaceId={spaceId}
                  combinedOpen={combinedOpen}
                  compact
                />
              </div>
            )
          ) : nodes.length === 0 && epics.length === 0 ? (
            <BoardDropZone
              kind="empty"
              status={status}
              index={null}
              spaceId={spaceId}
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
              spaceNameById={spaceNameById}
              showBoardName={showBoardName}
              spaceId={spaceId}
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
  spaceNameById,
  showBoardName,
  spaceId,
  onToggleDone,
  onCreateSubtask,
  statusDrop = false,
  depth = 0,
}: {
  nodes: NestedTask[];
  spaceNameById: Map<string, string>;
  showBoardName: boolean;
  spaceId?: string;
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
            spaceNameById={spaceNameById}
            showBoardName={showBoardName}
            spaceId={spaceId}
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
              spaceNameById={spaceNameById}
              showBoardName={showBoardName}
              spaceId={spaceId}
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
  spaceId,
  listSubmode,
  listSort,
  showEpics,
  showTasks,
  onListSubmodeChange,
  onListSortChange,
  onShowEpicsChange,
  onShowTasksChange,
}: ViewSettingsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Space view settings"
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
        {showEpics !== undefined && showTasks !== undefined ? (
          <>
            <div className="mx-2 my-1 h-px bg-border" />
            <SettingsRow
              icon={<RowsIcon size={16} />}
              label="Show epics"
              control={
                <SettingsChoice
                  label={showEpics ? "On" : "Off"}
                  pressed={showEpics}
                  onClick={() => onShowEpicsChange?.(!showEpics)}
                />
              }
            />
            <SettingsRow
              icon={<RowsIcon size={16} />}
              label="Show tasks"
              control={
                <SettingsChoice
                  label={showTasks ? "On" : "Off"}
                  pressed={showTasks}
                  onClick={() => onShowTasksChange?.(!showTasks)}
                />
              }
            />
          </>
        ) : null}
        {spaceId ? (
          <>
            <div className="mx-2 my-1 h-px bg-border" />
            <ProgressStageSettings spaceId={spaceId} />
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
  spaceId?: string | null;
  listSubmode: BoardListSubmode;
  listSort: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  };
  showEpics?: boolean;
  showTasks?: boolean;
  onListSubmodeChange: (next: BoardListSubmode) => void;
  onListSortChange: (next: {
    enabled: boolean;
    field: ListSortField;
    direction: "asc" | "desc";
  }) => void;
  onShowEpicsChange?: (next: boolean) => void;
  onShowTasksChange?: (next: boolean) => void;
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
