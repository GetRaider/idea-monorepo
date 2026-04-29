"use client";

import { Fragment, type ReactNode, useCallback, useState } from "react";

import { ChevronRightIcon } from "@/components/Icons";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import {
  getListSectionDefaultExpanded,
  getSingleListSectionDefaultExpanded,
  LIST_BOARD_STATUS_ORDER,
  SINGLE_LIST_SECTIONS,
} from "@/helpers/list-board.helper";
import { tasksHelper } from "@/helpers/task.helper";
import type { BoardListSubmode } from "@/hooks/tasks/useBoardListSubmode";
import { useListBoardDnd } from "@/hooks/tasks/useListBoardDnd";
import {
  BOARD_AUTO_SCROLL,
  BOARD_DROP_MEASURING,
  DndContext,
  listBoardCollisionDetection,
} from "@/lib/board-dnd";
import {
  TaskStatus,
  type Task,
  type TaskPriority,
  type TaskUpdate,
} from "@/types/task";

import { StatusIcon } from "../KanbanBoard/Column/Column.ui";
import { CollapsedSectionDropHeader } from "./CollapsedSectionDropHeader";
import { DropZoneBetween } from "./DropZoneBetween";
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
  const {
    sensors,
    activeDragSection,
    handleDragOver,
    handleDragCancel,
    handleDragEnd,
  } = useListBoardDnd({
    tasksByStatus,
    submode,
    onTaskStatusChange,
    onTaskFieldUpdate,
  });

  const [sectionOverrides, setSectionOverrides] = useState<
    Map<TaskStatus, boolean>
  >(() => new Map());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );

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
              {(isSingleList
                ? SINGLE_LIST_SECTIONS
                : LIST_BOARD_STATUS_ORDER
              ).map((entry) => {
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
                    ? getSingleListSectionDefaultExpanded(
                        label ?? status,
                        tasks.length,
                      )
                    : getListSectionDefaultExpanded(status, tasks.length));
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
                        onClick={() => handleToggleSection(status, isExpanded)}
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
                                    ? (taskRow, nextStatus) =>
                                        onTaskStatusChange(
                                          taskRow.id,
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
              })}
            </div>
          </HorizontalScroller>
        </ListBoardRoot>
      </DndContext>
    </div>
  );
}
