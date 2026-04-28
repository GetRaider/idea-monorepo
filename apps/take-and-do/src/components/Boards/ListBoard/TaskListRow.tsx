"use client";

import {
  CSS,
  subtaskDroppableId,
  type SubtaskDraggableData,
  type SubtaskDroppableData,
  type TaskDraggableData,
  useDraggable,
  useDroppable,
} from "@/lib/board-dnd";
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useRef,
  useState,
} from "react";

import { CalendarIcon, ChevronRightIcon } from "@/components/Icons";
import { TaskCheckbox } from "@/components/SelectableList";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import {
  DropdownItem,
  PriorityIconSpan,
} from "@/components/TaskView/TaskView.ui";
import { cn } from "@/lib/styles/utils";
import { tasksHelper } from "@/helpers/task.helper";
import { useClickOutside } from "@/hooks/ui/useClickOutside";

import { Task, TaskPriority, TaskStatus } from "../KanbanBoard/types";
import { ListRowAnchorMenu } from "./ListRowAnchorMenu";
import {
  PriorityButton,
  PriorityDropdownWrapper,
  SubtaskList,
  SubtaskRow,
  TaskKey,
  TaskMetaCell,
  TaskRow,
  TaskRowExpandButton,
  TaskRowOuter,
  TaskSummary,
} from "./ListBoard.ui";

const PRIORITY_ORDER: TaskPriority[] = Object.values(TaskPriority);
const STATUS_ORDER: TaskStatus[] = Object.values(TaskStatus);
const ROW_GRID_COLUMNS_WITH_STATUS =
  "grid-cols-[16px_18px_22px_22px_minmax(0,1fr)_minmax(6.5rem,7.5rem)]";

/** Stops dnd-kit's pointer sensor from claiming clicks on interactive controls. */
const stopDragPointer = (event: PointerEvent) => event.stopPropagation();

export interface TaskListRowProps {
  task: Task;
  isExpanded?: boolean;
  onToggleExpand?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onSubtaskClick?: (subtask: Task) => void;
  onToggleDone?: (task: Task) => void;
  showStatusPicker?: boolean;
  onStatusChange?: (task: Task, status: TaskStatus) => void;
  onPriorityChange?: (task: Task, priority: TaskPriority) => void;
  /** When provided, the schedule cell is clickable; passing `null` clears it. */
  onScheduleChange?: (task: Task, nextDate: Date | null) => void;
  onSubtaskToggleDone?: (subtask: Task) => void;
}

export function TaskListRow({
  task,
  isExpanded,
  onToggleExpand,
  onTaskClick,
  onSubtaskClick,
  onToggleDone,
  showStatusPicker,
  onStatusChange,
  onPriorityChange,
  onScheduleChange,
  onSubtaskToggleDone,
}: TaskListRowProps) {
  const isDone = task.status === TaskStatus.DONE;
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;

  const draggableData: TaskDraggableData = {
    type: "task",
    taskId: task.id,
    currentStatus: task.status,
    hasChildren: hasSubtasks,
  };

  const {
    attributes: draggableAttrs,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id, data: draggableData });

  const droppableData: SubtaskDroppableData = {
    type: "subtask",
    taskId: task.id,
  };
  // Droppable wraps the whole outer container (row + expanded subtasks) so the
  // user can drop anywhere within the parent group to make the active task a
  // subtask. The visual ring is still scoped to the parent row only.
  const {
    setNodeRef: setDroppableRef,
    isOver,
    active,
  } = useDroppable({
    id: subtaskDroppableId(task.id),
    data: droppableData,
  });

  const showSubtaskRing = isOver && active?.id !== task.id;

  // Stable identity for the View Transitions API so completion animates
  // smoothly between sections. Browsers without support ignore the property.
  const baseStyle: CSSProperties = {
    viewTransitionName: `list-task-${task.id}`,
  };
  const transformStyle: CSSProperties = transform
    ? { ...baseStyle, transform: CSS.Translate.toString(transform), zIndex: 50 }
    : baseStyle;

  const handleRowClick = () => {
    if (isDragging) return;
    onTaskClick?.(task);
  };

  return (
    <TaskRowOuter ref={setDroppableRef}>
      <TaskRow
        ref={setDraggableRef}
        isDone={isDone}
        aria-label={`Open ${task.summary}`}
        style={transformStyle}
        {...listeners}
        {...draggableAttrs}
        role="button"
        tabIndex={0}
        className={cn(
          showStatusPicker && ROW_GRID_COLUMNS_WITH_STATUS,
          isDragging && "opacity-40 focus-visible:ring-0",
          showSubtaskRing &&
            "ring-2 ring-inset ring-focus-ring bg-focus-ring/[0.08]",
        )}
        onClick={handleRowClick}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onTaskClick?.(task);
          }
        }}
      >
        {hasSubtasks ? (
          <TaskRowExpandButton
            aria-expanded={!!isExpanded}
            aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
            onPointerDown={stopDragPointer}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand?.(task);
            }}
          >
            <ChevronRightIcon
              size={12}
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
            />
          </TaskRowExpandButton>
        ) : (
          <span aria-hidden />
        )}

        <span onPointerDown={stopDragPointer} className="inline-flex">
          <TaskCheckbox
            checked={isDone}
            aria-label={isDone ? "Mark task as to do" : "Mark task as done"}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              onToggleDone?.(task);
            }}
          />
        </span>

        {showStatusPicker ? (
          <StatusPicker
            task={task}
            disabled={!onStatusChange}
            onPick={(status) => onStatusChange?.(task, status)}
          />
        ) : null}

        <PriorityPicker
          task={task}
          disabled={!onPriorityChange}
          onPick={(priority) => onPriorityChange?.(task, priority)}
        />

        <span className="flex min-w-0 items-center gap-2.5">
          {task.taskKey ? <TaskKey>{task.taskKey}</TaskKey> : null}
          <TaskSummary isDone={isDone}>{task.summary}</TaskSummary>
          {/* TODO: Enable progress donut once available on Task View. */}
        </span>

        <ScheduleCell
          value={task.scheduleDate}
          disabled={!onScheduleChange}
          onChange={(next) => onScheduleChange?.(task, next)}
        />
      </TaskRow>

      {isExpanded && hasSubtasks ? (
        <SubtaskList>
          {task.subtasks?.map((subtask) => (
            <SubtaskListEntry
              key={subtask.id}
              subtask={subtask}
              parentTaskId={task.id}
              onClick={() => onSubtaskClick?.(subtask)}
              onToggleDone={
                onSubtaskToggleDone
                  ? () => onSubtaskToggleDone(subtask)
                  : undefined
              }
            />
          ))}
        </SubtaskList>
      ) : null}
    </TaskRowOuter>
  );
}

interface SubtaskListEntryProps {
  subtask: Task;
  parentTaskId: string;
  onClick: () => void;
  onToggleDone?: () => void;
}

function SubtaskListEntry({
  subtask,
  parentTaskId,
  onClick,
  onToggleDone,
}: SubtaskListEntryProps) {
  const isDone = subtask.status === TaskStatus.DONE;

  const draggableData: SubtaskDraggableData = {
    type: "subtask",
    taskId: subtask.id,
    parentTaskId,
    currentStatus: subtask.status,
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: subtask.id, data: draggableData });

  const transformStyle: CSSProperties | undefined = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <SubtaskRow
      ref={setNodeRef}
      isDone={isDone}
      style={transformStyle}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      className={cn(isDragging && "opacity-40 focus-visible:ring-0")}
      onClick={() => {
        if (isDragging) return;
        onClick();
      }}
      onKeyDown={handleKeyDown}
    >
      <span onPointerDown={stopDragPointer} className="inline-flex">
        <TaskCheckbox
          checked={isDone}
          aria-label={isDone ? "Mark subtask as to do" : "Mark subtask as done"}
          disabled={!onToggleDone}
          onClick={(event: MouseEvent<HTMLInputElement>) =>
            event.stopPropagation()
          }
          onChange={(event) => {
            event.stopPropagation();
            onToggleDone?.();
          }}
        />
      </span>
      <span className="flex h-3.5 w-3.5 items-center justify-center text-sm leading-none">
        {tasksHelper.priority.getIconLabel(subtask.priority)}
      </span>
      {subtask.taskKey ? <TaskKey>{subtask.taskKey}</TaskKey> : null}
      <span
        className={
          isDone
            ? "truncate text-text-secondary line-through"
            : "truncate text-text-primary"
        }
      >
        {subtask.summary}
      </span>
    </SubtaskRow>
  );
}

interface ScheduleCellProps {
  value: Date | undefined;
  disabled?: boolean;
  onChange: (next: Date | null) => void;
}

function ScheduleCell({ value, disabled, onChange }: ScheduleCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, isEditing, () => setIsEditing(false));

  const label = tasksHelper.date.formatForSchedule(value);
  // Coerce — `value` is typed as Date but JSON-deserialized payloads (e.g.
  // react-query cache, guest store) come through as ISO strings.
  const inputValue = tasksHelper.date.formatForInput(value);

  const open = (event?: MouseEvent) => {
    event?.stopPropagation();
    if (!disabled) setIsEditing(true);
  };

  if (isEditing) {
    return (
      <TaskMetaCell
        aria-label="Scheduled date"
        className="-translate-x-1 justify-self-start pr-1"
      >
        <div
          ref={wrapperRef}
          className="relative max-w-full"
          onPointerDown={stopDragPointer}
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="date"
            autoFocus
            value={inputValue}
            onChange={(event) => {
              const next = event.target.value
                ? parseDateInputValue(event.target.value)
                : null;
              onChange(next);
            }}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Escape") {
                event.preventDefault();
                setIsEditing(false);
              }
            }}
            className="max-w-[min(100%,9.5rem)] min-w-0 rounded-md border border-input-border bg-input-bg px-1.5 py-1 text-xs text-text-primary outline-none focus-visible:border-focus-ring"
          />
        </div>
      </TaskMetaCell>
    );
  }

  if (!label) {
    if (disabled) return <TaskMetaCell aria-label="Scheduled date" />;
    // No date set → show a low-prominence "Set date" affordance on hover.
    return (
      <TaskMetaCell
        aria-label="Scheduled date"
        className="-translate-x-1 justify-self-start pr-1"
      >
        <button
          type="button"
          onPointerDown={stopDragPointer}
          onClick={open}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-0.5 text-xs text-text-tertiary opacity-0 transition-opacity hover:bg-white/[0.05] hover:text-text-secondary focus-visible:opacity-100 group-hover/row:opacity-100"
        >
          <CalendarIcon size={14} />
          <span>Set Schedule</span>
        </button>
      </TaskMetaCell>
    );
  }

  return (
    <TaskMetaCell
      aria-label="Scheduled date"
      className="-translate-x-1 justify-self-start pr-1"
    >
      <button
        type="button"
        disabled={disabled}
        onPointerDown={stopDragPointer}
        onClick={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border-0 bg-transparent px-1.5 py-0.5 text-xs text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary",
          disabled ? "cursor-default" : "cursor-pointer",
        )}
      >
        <CalendarIcon size={14} className="text-text-tertiary" />
        <span>{label}</span>
      </button>
    </TaskMetaCell>
  );
}

function parseDateInputValue(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

interface StatusPickerProps {
  task: Task;
  disabled?: boolean;
  onPick: (status: TaskStatus) => void;
}

function StatusPicker({ task, disabled, onPick }: StatusPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (disabled) return;
    setIsOpen((open) => !open);
  };

  const handlePick = (status: TaskStatus) => {
    setIsOpen(false);
    if (status === task.status) return;
    onPick(status);
  };

  return (
    <PriorityDropdownWrapper ref={wrapperRef} onPointerDown={stopDragPointer}>
      <PriorityButton
        aria-label={`Status: ${tasksHelper.status.getName(task.status)}`}
        aria-haspopup={disabled ? undefined : "menu"}
        aria-expanded={disabled ? undefined : isOpen}
        disabled={disabled}
        onClick={handleToggle}
      >
        <TaskStatusGlyph status={task.status} size={14} />
      </PriorityButton>
      <ListRowAnchorMenu
        open={isOpen}
        anchorRef={wrapperRef}
        onRequestClose={() => setIsOpen(false)}
      >
        {STATUS_ORDER.map((status) => (
          <DropdownItem
            key={status}
            aria-current={status === task.status ? "true" : undefined}
            className={
              status === task.status
                ? "border-l-2 border-l-indigo-400/70 bg-white/[0.07] pl-2 text-white"
                : undefined
            }
            onClick={(event) => {
              event.stopPropagation();
              handlePick(status);
            }}
          >
            <span className="mr-2 inline-flex w-4 justify-center">
              <TaskStatusGlyph status={status} size={14} />
            </span>
            {tasksHelper.status.getName(status)}
          </DropdownItem>
        ))}
      </ListRowAnchorMenu>
    </PriorityDropdownWrapper>
  );
}

interface PriorityPickerProps {
  task: Task;
  disabled?: boolean;
  onPick: (priority: TaskPriority) => void;
}

function PriorityPicker({ task, disabled, onPick }: PriorityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (disabled) return;
    setIsOpen((open) => !open);
  };

  const handlePick = (priority: TaskPriority) => {
    setIsOpen(false);
    onPick(priority);
  };

  return (
    <PriorityDropdownWrapper ref={wrapperRef} onPointerDown={stopDragPointer}>
      <PriorityButton
        aria-label={`Priority: ${tasksHelper.priority.getName(task.priority)}`}
        aria-haspopup={disabled ? undefined : "menu"}
        aria-expanded={disabled ? undefined : isOpen}
        disabled={disabled}
        onClick={handleToggle}
      >
        {tasksHelper.priority.getIconLabel(task.priority)}
      </PriorityButton>
      <ListRowAnchorMenu
        open={isOpen}
        anchorRef={wrapperRef}
        onRequestClose={() => setIsOpen(false)}
      >
        {PRIORITY_ORDER.map((priority) => (
          <DropdownItem
            key={priority}
            aria-current={priority === task.priority ? "true" : undefined}
            className={
              priority === task.priority
                ? "border-l-2 border-l-indigo-400/70 bg-white/[0.07] pl-2 text-white"
                : undefined
            }
            onClick={(event) => {
              event.stopPropagation();
              handlePick(priority);
            }}
          >
            <PriorityIconSpan>
              {tasksHelper.priority.getIconLabel(priority)}
            </PriorityIconSpan>
            {tasksHelper.priority.getName(priority)}
          </DropdownItem>
        ))}
      </ListRowAnchorMenu>
    </PriorityDropdownWrapper>
  );
}
