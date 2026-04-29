"use client";

import {
  BOARD_AUTO_SCROLL,
  BOARD_DROP_MEASURING,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type ListDraggableData,
  type ListDroppableData,
  collapsedSectionDroppableId,
  listBoardCollisionDetection,
  type ReorderDroppableData,
  useDroppable,
  useBoardPointerSensors,
} from "@/lib/board-dnd";
import {
  Fragment,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { ChevronRightIcon } from "@/components/Icons";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";

import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from "../KanbanBoard/types";
import { StatusIcon } from "../KanbanBoard/Column/Column.ui";
import {
  ChevronWrapper,
  EmptySectionMessage,
  HorizontalScroller,
  ListBoardRoot,
  ListSection,
  SectionBody,
  SectionCount,
  SectionHeader,
  SectionHeaderTitle,
} from "./ListBoard.ui";
import { TaskListRow } from "./TaskListRow";
import { DropZoneBetween } from "./DropZoneBetween";
import type { BoardListSubmode } from "@/hooks/tasks/useBoardListSubmode";
import { cn } from "@/lib/styles/utils";

const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
];

const SINGLE_LIST_SECTIONS = [
  {
    key: "tasks",
    label: "Tasks",
    dropStatus: TaskStatus.TODO,
    getTasks: (tasksByStatus: Record<TaskStatus, Task[]>) => [
      ...(tasksByStatus[TaskStatus.TODO] ?? []),
      ...(tasksByStatus[TaskStatus.IN_PROGRESS] ?? []),
    ],
  },
  {
    key: "done",
    label: "Done",
    dropStatus: TaskStatus.DONE,
    getTasks: (tasksByStatus: Record<TaskStatus, Task[]>) =>
      tasksByStatus[TaskStatus.DONE] ?? [],
  },
] as const;

/**
 * Default expansion: collapse the Done column and any empty columns. The user can
 * always override per-section, and that override sticks until they toggle again.
 */
function getDefaultExpanded(status: TaskStatus, taskCount: number): boolean {
  if (taskCount === 0) return false;
  if (status === TaskStatus.DONE) return false;
  return true;
}

function getSingleListDefaultExpanded(
  label: string,
  taskCount: number,
): boolean {
  if (taskCount === 0) return false;
  if (label === "Done") return false;
  return true;
}

export interface ListBoardProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  submode?: BoardListSubmode;
  /** Optional content rendered above the first status section (e.g. quick-create row). */
  topSlot?: ReactNode;
  onTaskClick?: (task: Task) => void;
  onSubtaskClick?: (subtask: Task) => void;
  /** Toggling a top-level task moves/reorders it. `targetIndex` is honored. */
  onTaskStatusChange?: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  /**
   * In-place update for any task field (priority, subtask status, parent re-parent,
   * etc.). Used for changes that aren't simple status moves.
   */
  onTaskFieldUpdate?: (taskId: string, patch: TaskUpdate) => void;
}

export function ListBoard({
  tasksByStatus,
  submode = "grouped",
  topSlot,
  onTaskClick,
  onSubtaskClick,
  onTaskStatusChange,
  onTaskFieldUpdate,
}: ListBoardProps) {
  const sensors = useBoardPointerSensors();

  const [sectionOverrides, setSectionOverrides] = useState<
    Map<TaskStatus, boolean>
  >(() => new Map());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeDragSection, setActiveDragSection] = useState<TaskStatus | null>(
    null,
  );

  /**
   * Index of every visible task by id → which section it belongs to. Used to
   * resolve the active section when the cursor is hovering a "subtask"
   * droppable (whose data only carries the target task id).
   */
  const taskStatusById = useMemo(() => {
    const map = new Map<string, TaskStatus>();
    for (const status of STATUS_ORDER) {
      for (const task of tasksByStatus[status] ?? []) {
        map.set(task.id, status);
      }
    }
    return map;
  }, [tasksByStatus]);

  const handleToggleSection = useCallback(
    (status: TaskStatus, isCurrentlyExpanded: boolean) => {
      setSectionOverrides((prev) => {
        const next = new Map(prev);
        next.set(status, !isCurrentlyExpanded);
        return next;
      });
    },
    [],
  );

  const handleToggleExpandTask = useCallback((task: Task) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(task.id)) next.delete(task.id);
      else next.add(task.id);
      return next;
    });
  }, []);

  const handleToggleDone = useCallback(
    (task: Task) => {
      if (!onTaskStatusChange) return;
      const next =
        task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
      onTaskStatusChange(task.id, next);
    },
    [onTaskStatusChange],
  );

  const handlePriorityChange = useCallback(
    (task: Task, priority: TaskPriority) => {
      if (!onTaskFieldUpdate || priority === task.priority) return;
      onTaskFieldUpdate(task.id, { priority });
    },
    [onTaskFieldUpdate],
  );

  const handleSubtaskToggleDone = useCallback(
    (subtask: Task) => {
      if (!onTaskFieldUpdate) return;
      const nextStatus =
        subtask.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
      onTaskFieldUpdate(subtask.id, { status: nextStatus });
    },
    [onTaskFieldUpdate],
  );

  const handleScheduleChange = useCallback(
    (task: Task, nextDate: Date | null) => {
      if (!onTaskFieldUpdate) return;
      // `task.scheduleDate` is typed as Date but can be an ISO string when the
      // task came from a JSON-serialized cache/store; parse it defensively.
      const current = tasksHelper.date.parse(task.scheduleDate);
      const sameDay =
        current &&
        nextDate &&
        current.getFullYear() === nextDate.getFullYear() &&
        current.getMonth() === nextDate.getMonth() &&
        current.getDate() === nextDate.getDate();
      const bothEmpty = !current && !nextDate;
      if (sameDay || bothEmpty) return;
      onTaskFieldUpdate(task.id, { scheduleDate: nextDate });
    },
    [onTaskFieldUpdate],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const dropData = event.over?.data.current as
        | ListDroppableData
        | undefined;
      if (!dropData) {
        setActiveDragSection(null);
        return;
      }
      if (dropData.type === "reorder") {
        setActiveDragSection(dropData.status);
        return;
      }
      // For "subtask" drops, derive the section from the target task.
      setActiveDragSection(taskStatusById.get(dropData.taskId) ?? null);
    },
    [taskStatusById],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragSection(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragSection(null);
      const { active, over } = event;
      if (!over) return;
      const dragData = active.data.current as ListDraggableData | undefined;
      const dropData = over.data.current as ListDroppableData | undefined;
      if (!dragData || !dropData) return;

      // Drop inside another task's body → re-parent as subtask.
      if (dropData.type === "subtask") {
        if (dragData.taskId === dropData.taskId) return;
        if (
          dragData.type === "subtask" &&
          dragData.parentTaskId === dropData.taskId
        ) {
          return;
        }
        // The server rejects re-parenting a task that already has subtasks. We
        // bail early so the UI doesn't appear to accept an invalid drop.
        if (dragData.type === "task" && dragData.hasChildren) return;
        onTaskFieldUpdate?.(dragData.taskId, {
          parentTaskId: dropData.taskId,
        });
        return;
      }

      // Drop on a between-zone → reorder / move-status / detach.
      if (dropData.type === "reorder") {
        const { index: rawTargetIndex } = dropData;
        const todoLen = tasksByStatus[TaskStatus.TODO]?.length ?? 0;
        const inProgressLen =
          tasksByStatus[TaskStatus.IN_PROGRESS]?.length ?? 0;
        const { targetStatus, targetIndex } =
          submode === "single" && dropData.status === TaskStatus.TODO
            ? resolveSingleListTasksSectionDrop(
                rawTargetIndex,
                todoLen,
                inProgressLen,
              )
            : {
                targetStatus: dropData.status,
                targetIndex: rawTargetIndex,
              };
        if (dragData.type === "subtask") {
          // Detach to top-level + change status. Index isn't honored for
          // detached subtasks because the optimistic flow elsewhere relies on
          // a refetch (see SingleKanbanBoard / MultipleKanbanBoard).
          onTaskFieldUpdate?.(dragData.taskId, {
            parentTaskId: null,
            status: targetStatus,
          });
          return;
        }
        onTaskStatusChange?.(dragData.taskId, targetStatus, targetIndex);
      }
    },
    [onTaskFieldUpdate, onTaskStatusChange, submode, tasksByStatus],
  );

  const isSingleList = submode === "single";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={listBoardCollisionDetection}
        measuring={BOARD_DROP_MEASURING}
        autoScroll={BOARD_AUTO_SCROLL}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <ListBoardRoot>
          <HorizontalScroller>
            <div className="flex w-full min-w-[560px] flex-col gap-2">
              {topSlot ? <div className="px-1 pt-1">{topSlot}</div> : null}
              {(isSingleList ? SINGLE_LIST_SECTIONS : STATUS_ORDER).map(
                (entry) => {
                  const status =
                    typeof entry === "string" ? entry : entry.dropStatus;
                  const label = typeof entry === "string" ? null : entry.label;
                  const displayTasks =
                    typeof entry === "string"
                      ? (tasksByStatus[entry] ?? [])
                      : entry.getTasks(tasksByStatus);
                  const tasks = displayTasks;
                  const override = sectionOverrides.get(status);
                  const isExpanded =
                    override ??
                    (isSingleList
                      ? getSingleListDefaultExpanded(
                          label ?? status,
                          tasks.length,
                        )
                      : getDefaultExpanded(status, tasks.length));
                  const isSectionActiveDrop = activeDragSection === status;
                  return (
                    <ListSection
                      key={typeof entry === "string" ? entry : entry.key}
                      isActiveDrop={isSectionActiveDrop}
                    >
                      <CollapsedSectionDropHeader
                        status={status}
                        insertIndex={tasks.length}
                        enabled={!isExpanded}
                      >
                        <SectionHeader
                          status={status}
                          className="w-full max-w-none self-stretch"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            handleToggleSection(status, isExpanded)
                          }
                        >
                          <ChevronWrapper isExpanded={isExpanded}>
                            <ChevronRightIcon size={14} />
                          </ChevronWrapper>
                          <SectionHeaderTitle>
                            <StatusIcon status={status}>
                              <TaskStatusGlyph status={status} size={14} />
                            </StatusIcon>
                            <span>
                              {label ?? tasksHelper.status.getName(status)}
                            </span>
                            <SectionCount>{tasks.length}</SectionCount>
                          </SectionHeaderTitle>
                        </SectionHeader>
                      </CollapsedSectionDropHeader>
                      <SectionBody isExpanded={isExpanded}>
                        {tasks.length === 0 ? (
                          <DropZoneBetween
                            status={status}
                            index={0}
                            variant="empty-section"
                          >
                            <EmptySectionMessage>No tasks</EmptySectionMessage>
                          </DropZoneBetween>
                        ) : (
                          <>
                            <DropZoneBetween status={status} index={0} />
                            {tasks.map((task, idx) => (
                              <Fragment key={task.id}>
                                <TaskListRow
                                  task={task}
                                  isExpanded={expandedTaskIds.has(task.id)}
                                  onToggleExpand={handleToggleExpandTask}
                                  onTaskClick={onTaskClick}
                                  onSubtaskClick={onSubtaskClick}
                                  onToggleDone={
                                    onTaskStatusChange
                                      ? handleToggleDone
                                      : undefined
                                  }
                                  showStatusPicker={isSingleList}
                                  onStatusChange={
                                    onTaskStatusChange
                                      ? (task, nextStatus) =>
                                          onTaskStatusChange(
                                            task.id,
                                            nextStatus,
                                          )
                                      : undefined
                                  }
                                  onPriorityChange={
                                    onTaskFieldUpdate
                                      ? handlePriorityChange
                                      : undefined
                                  }
                                  onScheduleChange={
                                    onTaskFieldUpdate
                                      ? handleScheduleChange
                                      : undefined
                                  }
                                  onSubtaskToggleDone={
                                    onTaskFieldUpdate
                                      ? handleSubtaskToggleDone
                                      : undefined
                                  }
                                />
                                {idx < tasks.length - 1 ? (
                                  <DropZoneBetween
                                    status={status}
                                    index={idx + 1}
                                  />
                                ) : null}
                              </Fragment>
                            ))}
                            <DropZoneBetween
                              status={status}
                              index={tasks.length}
                            />
                          </>
                        )}
                      </SectionBody>
                    </ListSection>
                  );
                },
              )}
            </div>
          </HorizontalScroller>
        </ListBoardRoot>
      </DndContext>
    </div>
  );
}

/**
 * Single-list "Tasks" section merges TODO then IN_PROGRESS but droppables still
 * report {@link TaskStatus.TODO}. Map a merged insertion index (0 … todo+inProg)
 * to the real column + index — same idea as grouped list, but one visual stack.
 */
function resolveSingleListTasksSectionDrop(
  rawIndex: number,
  todoCount: number,
  inProgressCount: number,
): { targetStatus: TaskStatus; targetIndex: number } {
  const T = todoCount;
  const P = inProgressCount;

  if (rawIndex <= T) {
    if (P > 0 && rawIndex === T) {
      return { targetStatus: TaskStatus.IN_PROGRESS, targetIndex: 0 };
    }
    return {
      targetStatus: TaskStatus.TODO,
      targetIndex: Math.max(0, Math.min(rawIndex, T)),
    };
  }

  return {
    targetStatus: TaskStatus.IN_PROGRESS,
    targetIndex: Math.max(0, Math.min(rawIndex - T, P)),
  };
}

function CollapsedSectionDropHeader({
  status,
  insertIndex,
  enabled,
  children,
}: {
  status: TaskStatus;
  insertIndex: number;
  enabled: boolean;
  children: ReactNode;
}) {
  const data: ReorderDroppableData = {
    type: "reorder",
    status,
    index: insertIndex,
    collapsedSectionHeader: true,
  };
  const { setNodeRef } = useDroppable({
    id: collapsedSectionDroppableId(status),
    data,
    disabled: !enabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("relative z-20 w-full min-w-0", enabled && "min-h-[44px]")}
    >
      {children}
    </div>
  );
}
