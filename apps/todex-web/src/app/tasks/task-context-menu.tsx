"use client";

import { Fragment, useState, type FormEvent, type ReactNode } from "react";
import {
  Calendar,
  Checkbox,
  ConfirmDialog,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  cn,
} from "@repo/ui";
import {
  formatEstimation,
  parseEstimation,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type {
  AcceptanceCriterion,
  Task,
  UpdateTaskBody,
} from "@repo/api/todex";

import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  RepeatIcon,
  StatusDoneIcon,
} from "@components/icons";

import { useBoardAxes } from "./board-axes";
import {
  AreaMark,
  BoardMark,
  ParentMark,
  PriorityGlyph,
  StageMark,
  StatusGlyph,
} from "./task-board.ui";
import { TaskRecurrenceEditor } from "./task-recurrence-picker";
import {
  dateInputToLocalDayStartIso,
  dateInputToScheduleIso,
  isoToDateInput,
  startOfLocalDay,
  STATUS_LABEL,
  STATUS_ORDER,
} from "./task-helpers";
import { collectDescendantIds } from "./task-selection";
import { useTasks } from "./tasks-provider";

const ESTIMATE_PRESETS = ["15m", "30m", "1h", "2h", "4h", "1d"] as const;

export function TaskContextMenu({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const {
    state: { tasks, selectedTaskIds },
    actions: { focusTaskSelection, removeTasks },
  } = useTasks();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const targets = resolveMenuTargets(tasks, selectedTaskIds, taskId);
  const deleteLabel =
    targets.length === 1
      ? `Delete "${targets[0]?.summary ?? "task"}"?`
      : `Delete ${targets.length} tasks?`;

  return (
    <>
      <ContextMenu
        onOpenChange={(open) => {
          if (open) focusTaskSelection(taskId);
        }}
      >
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent
          className="w-56"
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={keepNestedPopup}
          onPointerDownOutside={keepNestedPopup}
        >
          <TaskContextMenuItems
            targets={targets}
            onDelete={() => setDeleteOpen(true)}
          />
        </ContextMenuContent>
      </ContextMenu>
      {deleteOpen ? (
        <ConfirmDialog
          title="Delete task"
          description={deleteLabel}
          confirmLabel="Delete"
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => removeTasks(targets.map((task) => task.id))}
        />
      ) : null}
    </>
  );
}

function TaskContextMenuItems({
  targets,
  onDelete,
}: {
  targets: Task[];
  onDelete: () => void;
}) {
  const {
    state: { tasks, boards },
    actions: { updateTask, updateTaskStatus, createTask },
  } = useTasks();
  const single = targets.length === 1 ? (targets[0] ?? null) : null;
  const sharedBoardId = sharedValue(targets, (task) => task.taskBoardId);
  const boardAxes = useBoardAxes(sharedBoardId);
  const areas = boardAxes.data?.areas ?? [];
  const stages = boardAxes.data?.progressStages ?? [];
  const status = sharedValue(targets, (task) => task.status);
  const priority = sharedValue(targets, (task) => task.priority);
  const areaId = sharedValue(targets, (task) => task.areaId);
  const stageId = sharedValue(targets, (task) => task.progressStageId);
  const parentOptions = single
    ? tasks.filter(
        (task) =>
          task.id !== single.id &&
          !collectDescendantIds(tasks, single.id).has(task.id),
      )
    : [];

  function patch(body: UpdateTaskBody) {
    for (const task of targets) updateTask(task.id, body, { quiet: true });
  }

  const stageDisabled = !sharedBoardId || stages.length === 0;
  const areaDisabled = !sharedBoardId || areas.length === 0;
  const boardDisabled = boards.length < 2;
  const entries = [
    {
      key: "status",
      disabled: false,
      node: (
        <RadioSubmenu
          icon={<StatusGlyph status={menuStatus(status)} />}
          label="Status"
          value={status}
        >
          {STATUS_ORDER.map((option) => (
            <ContextMenuRadioItem
              key={option}
              value={option}
              onSelect={() => {
                for (const task of targets) updateTaskStatus(task.id, option);
              }}
            >
              <StatusGlyph status={option} />
              {STATUS_LABEL[option]}
            </ContextMenuRadioItem>
          ))}
        </RadioSubmenu>
      ),
    },
    {
      key: "stage",
      disabled: stageDisabled,
      node: (
        <RadioSubmenu
          icon={<StageMark />}
          label="Stage"
          value={
            stages.some((stage) => stage.id === stageId)
              ? (stageId ?? "none")
              : "none"
          }
          disabled={stageDisabled}
        >
          <ContextMenuRadioItem
            value="none"
            onSelect={() => patch({ progressStageId: null })}
          >
            None
          </ContextMenuRadioItem>
          {stages.map((stage) => (
            <ContextMenuRadioItem
              key={stage.id}
              value={stage.id}
              onSelect={() => patch({ progressStageId: stage.id })}
            >
              {stage.name}
            </ContextMenuRadioItem>
          ))}
        </RadioSubmenu>
      ),
    },
    {
      key: "priority",
      disabled: false,
      node: (
        <RadioSubmenu
          icon={<PriorityGlyph priority={menuPriority(priority)} />}
          label="Priority"
          value={priority}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <ContextMenuRadioItem
              key={option}
              value={option}
              onSelect={() => patch({ priority: option })}
            >
              <PriorityGlyph priority={option} />
              {PRIORITY_LABEL[option]}
            </ContextMenuRadioItem>
          ))}
        </RadioSubmenu>
      ),
    },
    {
      key: "board",
      disabled: boardDisabled,
      node: (
        <RadioSubmenu
          icon={<BoardMark />}
          label="Board"
          value={sharedValue(targets, (task) => task.taskBoardId)}
          disabled={boardDisabled}
        >
          {boards.map((board) => (
            <ContextMenuRadioItem
              key={board.id}
              value={board.id}
              onSelect={() => patch({ taskBoardId: board.id })}
            >
              {board.name}
            </ContextMenuRadioItem>
          ))}
        </RadioSubmenu>
      ),
    },
    {
      key: "area",
      disabled: areaDisabled,
      node: (
        <RadioSubmenu
          icon={<AreaMark />}
          label="Area"
          value={areas.some((area) => area.id === areaId) ? areaId : undefined}
          disabled={areaDisabled}
        >
          {areas.map((area) => (
            <ContextMenuRadioItem
              key={area.id}
              value={area.id}
              onSelect={() => patch({ areaId: area.id })}
            >
              {area.name}
            </ContextMenuRadioItem>
          ))}
        </RadioSubmenu>
      ),
    },
    {
      key: "estimate",
      disabled: false,
      node: (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <ClockIcon size={16} />
            Estimate
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <EstimateMenu
              value={
                targets.length === 1 && single
                  ? formatEstimation(single.estimation)
                  : sharedEstimation(targets)
              }
              onCommit={(estimation) => patch({ estimation })}
            />
          </ContextMenuSubContent>
        </ContextMenuSub>
      ),
    },
    {
      key: "schedule",
      disabled: false,
      node: (
        <DateSubmenu
          icon={<CalendarIcon size={16} />}
          label="Schedule"
          value={sharedValue(targets, (task) => task.scheduleDate)}
          toIso={dateInputToScheduleIso}
          onChange={(scheduleDate) => patch({ scheduleDate })}
        />
      ),
    },
    {
      key: "due",
      disabled: false,
      node: (
        <DateSubmenu
          icon={<CalendarIcon size={16} />}
          label="Due"
          value={sharedValue(targets, (task) => task.dueDate)}
          onChange={(dueDate) => patch({ dueDate })}
        />
      ),
    },
    {
      key: "repeat",
      disabled: !single,
      node: (
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!single}>
            <RepeatIcon size={16} />
            Repeat
          </ContextMenuSubTrigger>
          <ContextMenuSubContent
            className="w-80 p-3"
            onInteractOutside={keepNestedPopup}
            onPointerDownOutside={keepNestedPopup}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {single ? (
              <TaskRecurrenceEditor
                recurrence={single.recurrence}
                scheduleDate={single.scheduleDate}
                dueDate={single.dueDate}
                onChange={(recurrence) => {
                  if (
                    recurrence &&
                    single.scheduleDate == null &&
                    single.dueDate == null
                  ) {
                    updateTask(
                      single.id,
                      {
                        recurrence,
                        scheduleDate: startOfLocalDay().toISOString(),
                      },
                      { quiet: true },
                    );
                    return;
                  }
                  updateTask(single.id, { recurrence }, { quiet: true });
                }}
              />
            ) : null}
          </ContextMenuSubContent>
        </ContextMenuSub>
      ),
    },
    {
      key: "parent",
      disabled: !single,
      node: (
        <RadioSubmenu
          icon={<ParentMark />}
          label="Parent"
          value={single ? (single.parentTaskId ?? "none") : undefined}
          disabled={!single}
        >
          <ContextMenuRadioItem
            value="none"
            onSelect={() => {
              if (single)
                updateTask(single.id, { parentTaskId: null }, { quiet: true });
            }}
          >
            None
          </ContextMenuRadioItem>
          {parentOptions.map((task) => (
            <ContextMenuRadioItem
              key={task.id}
              value={task.id}
              onSelect={() => {
                if (single) {
                  updateTask(
                    single.id,
                    { parentTaskId: task.id },
                    { quiet: true },
                  );
                }
              }}
            >
              {task.taskKey} {task.summary}
            </ContextMenuRadioItem>
          ))}
        </RadioSubmenu>
      ),
    },
    {
      key: "criteria",
      disabled: !single,
      node: (
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!single}>
            <StatusDoneIcon size={16} />
            Acceptance criteria
          </ContextMenuSubTrigger>
          <ContextMenuSubContent
            className="w-72 p-2"
            onKeyDown={(event) => event.stopPropagation()}
          >
            {single ? (
              <CriteriaMenu
                criteria={single.acceptanceCriteria}
                onChange={(acceptanceCriteria) =>
                  updateTask(
                    single.id,
                    { acceptanceCriteria },
                    { quiet: true },
                  )
                }
              />
            ) : null}
          </ContextMenuSubContent>
        </ContextMenuSub>
      ),
    },
    {
      key: "subtask",
      disabled: !single,
      node: (
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!single}>
            <PlusIcon size={16} />
            Add subtask
          </ContextMenuSubTrigger>
          <ContextMenuSubContent
            className="w-64 p-2"
            onKeyDown={(event) => event.stopPropagation()}
          >
            {single ? (
              <SubtaskMenu
                onCreate={(summary) =>
                  createTask(summary, single.id, {
                    areaId: single.areaId,
                    progressStageId: single.progressStageId,
                  })
                }
              />
            ) : null}
          </ContextMenuSubContent>
        </ContextMenuSub>
      ),
    },
  ];
  const enabledEntries = entries.filter((entry) => !entry.disabled);
  const disabledEntries = entries.filter((entry) => entry.disabled);

  return (
    <>
      <ContextMenuLabel>
        {single ? single.taskKey : `${targets.length} tasks`}
      </ContextMenuLabel>
      <ContextMenuSeparator />
      {enabledEntries.map((entry) => (
        <Fragment key={entry.key}>{entry.node}</Fragment>
      ))}
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={onDelete}>Delete</ContextMenuItem>
      {disabledEntries.length > 0 ? (
        <>
          <ContextMenuSeparator />
          {disabledEntries.map((entry) => (
            <Fragment key={entry.key}>{entry.node}</Fragment>
          ))}
        </>
      ) : null}
    </>
  );
}

function RadioSubmenu({
  icon,
  label,
  value,
  disabled,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger disabled={disabled}>
        {icon}
        {label}
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="max-h-72 w-56 overflow-y-auto">
        <ContextMenuRadioGroup value={value ?? ""}>
          {children}
        </ContextMenuRadioGroup>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}

function DateSubmenu({
  icon,
  label,
  value,
  onChange,
  toIso = dateInputToLocalDayStartIso,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  toIso?: (yearMonthDay: string) => string | null;
  onChange: (value: string | null) => void;
}) {
  const selected = dateFromInput(isoToDateInput(value));
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        {icon}
        {label}
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) =>
            onChange(
              date ? toIso(dateToInput(date)) : null,
            )
          }
        />
        {value ? (
          <ContextMenuItem onSelect={() => onChange(null)}>
            Clear
          </ContextMenuItem>
        ) : null}
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}

function EstimateMenu({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (estimation: number | null) => void;
}) {
  const [draft, setDraft] = useState(value);
  const parsed = parseEstimation(draft);
  const invalid = draft.trim() !== "" && parsed === null;

  function commit(next: string) {
    const estimation = parseEstimation(next);
    if (next.trim() !== "" && estimation === null) return;
    onCommit(next.trim() ? estimation : null);
  }

  return (
    <div onKeyDown={(event) => event.stopPropagation()}>
      <div className="flex flex-col">
        {ESTIMATE_PRESETS.map((preset) => (
          <ContextMenuItem key={preset} onSelect={() => commit(preset)}>
            {preset}
          </ContextMenuItem>
        ))}
      </div>
      <input
        aria-label="Estimate"
        value={draft}
        placeholder="1h 30m"
        className="mx-1 mb-1 h-8 w-[calc(100%-0.5rem)] rounded-md border border-border bg-transparent px-2 text-sm outline-none"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
          }
        }}
      />
      {invalid ? (
        <p className="px-2 pb-1 text-xs text-destructive">Use 1h, 30m, or 2d</p>
      ) : null}
      <ContextMenuItem onSelect={() => onCommit(null)}>Clear</ContextMenuItem>
    </div>
  );
}

function CriteriaMenu({
  criteria,
  onChange,
}: {
  criteria: AcceptanceCriterion[];
  onChange: (criteria: AcceptanceCriterion[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addCriterion(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onChange([...criteria, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      {criteria.map((criterion) => (
        <div key={criterion.id} className="flex items-center gap-2">
          <Checkbox
            checked={criterion.done}
            aria-label={`Mark "${criterion.text}" done`}
            onCheckedChange={(checked) =>
              onChange(
                criteria.map((item) =>
                  item.id === criterion.id
                    ? { ...item, done: checked === true }
                    : item,
                ),
              )
            }
          />
          <input
            aria-label="Criterion"
            defaultValue={criterion.text}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm outline-none",
              criterion.done && "text-muted-foreground line-through",
            )}
            onBlur={(event) => {
              const text = event.target.value.trim();
              if (!text || text === criterion.text) return;
              onChange(
                criteria.map((item) =>
                  item.id === criterion.id ? { ...item, text } : item,
                ),
              );
            }}
          />
          <button
            type="button"
            aria-label={`Remove "${criterion.text}"`}
            className="text-muted-foreground hover:text-foreground"
            onClick={() =>
              onChange(criteria.filter((item) => item.id !== criterion.id))
            }
          >
            ×
          </button>
        </div>
      ))}
      <form className="flex items-center gap-2" onSubmit={addCriterion}>
        <input
          aria-label="Add acceptance criterion"
          value={draft}
          placeholder="Add criterion"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>
    </div>
  );
}

function SubtaskMenu({ onCreate }: { onCreate: (summary: string) => void }) {
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextSummary = summary.trim();
    if (!nextSummary) return;
    onCreate(nextSummary);
    setSummary("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Add subtask"
        value={summary}
        placeholder="Add subtask"
        className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        onChange={(event) => setSummary(event.target.value)}
      />
    </form>
  );
}

function resolveMenuTargets(
  tasks: Task[],
  selectedTaskIds: ReadonlySet<string>,
  taskId: string,
): Task[] {
  const selected = tasks.filter((task) => selectedTaskIds.has(task.id));
  if (selected.some((task) => task.id === taskId)) return selected;
  const task = tasks.find((item) => item.id === taskId);
  return task ? [task] : [];
}

function menuStatus(value: string | null): Task["status"] {
  if (
    value === TaskStatus.TODO ||
    value === TaskStatus.IN_PROGRESS ||
    value === TaskStatus.DONE ||
    value === TaskStatus.CANCELLED
  ) {
    return value;
  }
  return TaskStatus.TODO;
}

function menuPriority(value: string | null): Task["priority"] {
  if (
    value === TaskPriority.LOW ||
    value === TaskPriority.MEDIUM ||
    value === TaskPriority.HIGH ||
    value === TaskPriority.CRITICAL
  ) {
    return value;
  }
  return TaskPriority.MEDIUM;
}

function sharedValue(
  tasks: Task[],
  read: (task: Task) => string | null,
): string | null {
  const first = tasks[0];
  if (!first) return null;
  const value = read(first);
  return tasks.every((task) => read(task) === value) ? value : null;
}

function sharedEstimation(tasks: Task[]): string {
  const first = tasks[0];
  if (!first) return "";
  return tasks.every((task) => task.estimation === first.estimation)
    ? formatEstimation(first.estimation)
    : "";
}

function keepNestedPopup(event: {
  target: EventTarget | null;
  preventDefault: () => void;
}) {
  const target = event.target;
  const element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (
    element?.closest(
      "[data-radix-popper-content-wrapper], [data-radix-select-content], [role='listbox']",
    )
  ) {
    event.preventDefault();
  }
}

function dateFromInput(value: string): Date | undefined {
  if (!value) return undefined;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function dateToInput(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const PRIORITY_OPTIONS = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
] as const;

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};
