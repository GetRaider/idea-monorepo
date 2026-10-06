"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Checkbox,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import {
  DocType,
  formatEstimation,
  parseEstimation,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type {
  AcceptanceCriterion,
  Task,
  TaskBoard,
  UpdateTaskBody,
} from "@repo/api/todex";

import { ResizeHandle } from "@components/resize-handle";
import {
  CalendarIcon,
  ChevronIcon,
  ClockIcon,
  CloseIcon,
  DockRightIcon,
  EllipsisIcon,
  ExpandIcon,
  PlusIcon,
  RepeatIcon,
  StatusDoneIcon,
} from "@components/icons";
import { todexClient } from "@lib/todex-client";
import {
  readTaskPanelWidth,
  readTaskViewMode,
  writeTaskPanelWidth,
  writeTaskViewMode,
} from "@/helpers/task-view-layout";
import {
  TASK_PANEL_DEFAULT_WIDTH,
  TASK_PANEL_MAX_WIDTH,
  TASK_PANEL_MIN_WIDTH,
  type TaskViewMode,
} from "@/helpers/panel-layout";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { useBoardAxes } from "./board-axes";
import { DatePicker, EstimatePicker } from "./task-pickers";
import { TaskRecurrencePicker } from "./task-recurrence-picker";
import { TaskDescriptionEditor } from "./task-description-editor";
import {
  AreaMark,
  BoardGlyph,
  BoardMark,
  ParentMark,
  PriorityGlyph,
  StageMark,
  StatusGlyph,
  TaskProgressBar,
  TasksBreadcrumb,
} from "./task-board.ui";
import {
  acceptanceCriteriaAreMet,
  dateInputToLocalDayStartIso,
  isoToDateInput,
  startOfLocalDay,
  taskChecklistProgress,
  STATUS_LABEL,
  STATUS_ORDER,
} from "./task-helpers";
import { collectDescendantIds } from "./task-selection";
import { useTasks } from "./tasks-provider";

const SAVE_DEBOUNCE_MS = 600;
const LG_QUERY = "(min-width: 1024px)";

export function TaskView() {
  const {
    state: { selectedTask, tasks, boards },
    actions: {
      setSelectedTaskId,
      updateTask,
      updateTaskStatus,
      createTask,
      removeTask,
    },
  } = useTasks();
  const isLargeScreen = useMinWidthLg();
  const [mode, setMode] = useState<TaskViewMode>("docked");
  const [panelWidth, setPanelWidth] = useState(TASK_PANEL_DEFAULT_WIDTH);

  useEffect(() => {
    setMode(readTaskViewMode());
    setPanelWidth(readTaskPanelWidth());
  }, []);

  if (!selectedTask) return null;

  const isDocked = isLargeScreen && mode === "docked";

  const orderedTasks = [...tasks].sort(compareTasksForNavigation);
  const taskIndex = orderedTasks.findIndex(
    (item) => item.id === selectedTask.id,
  );
  const previousTask = taskIndex > 0 ? orderedTasks[taskIndex - 1] : null;
  const nextTask =
    taskIndex >= 0 && taskIndex < orderedTasks.length - 1
      ? orderedTasks[taskIndex + 1]
      : null;

  const board = boards.find((item) => item.id === selectedTask.taskBoardId);
  const boardName = board?.name ?? "Board";

  return (
    <div
      className={
        isDocked
          ? "relative flex min-h-0 shrink-0 flex-col border-l border-border bg-canvas text-foreground"
          : "absolute inset-0 z-20 flex min-h-0 flex-col bg-canvas text-foreground"
      }
      style={isDocked ? { width: panelWidth } : undefined}
    >
      {isDocked ? (
        <ResizeHandle
          label="Resize task panel"
          edge="leading"
          width={panelWidth}
          min={TASK_PANEL_MIN_WIDTH}
          max={TASK_PANEL_MAX_WIDTH}
          onWidth={setPanelWidth}
          onCommit={writeTaskPanelWidth}
        />
      ) : null}
      <header
        className={cn(
          "flex items-center gap-3 border-b border-border",
          isDocked ? "px-3 py-1.5" : "px-6 py-3",
        )}
      >
        {isDocked ? (
          <span className="min-w-0 flex-1 truncate text-sm font-medium tabular-nums text-muted-foreground">
            {selectedTask.taskKey}
          </span>
        ) : (
          <TasksBreadcrumb
            className="min-w-0 flex-1 text-2xl font-semibold tracking-tight"
            boardName={boardName}
            boardHref={
              board
                ? tasksUrlHelper.routing.buildBoardUrl(board.name)
                : undefined
            }
            taskKey={selectedTask.taskKey}
            trailing={<BoardGlyph />}
          />
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          {taskIndex >= 0 ? (
            <>
              <PagerButton
                label="Previous task"
                disabled={!previousTask}
                onClick={() => {
                  if (previousTask) setSelectedTaskId(previousTask.id);
                }}
              >
                <ChevronIcon size={14} className="rotate-180" />
              </PagerButton>
              <span className="min-w-8 text-center text-[11px] tabular-nums text-muted-foreground">
                {taskIndex + 1}/{orderedTasks.length}
              </span>
              <PagerButton
                label="Next task"
                disabled={!nextTask}
                onClick={() => {
                  if (nextTask) setSelectedTaskId(nextTask.id);
                }}
              >
                <ChevronIcon size={14} />
              </PagerButton>
            </>
          ) : null}
          <TaskViewMenu
            summary={selectedTask.summary}
            onDelete={() => removeTask(selectedTask.id)}
          />
          {isLargeScreen ? (
            <PagerButton
              label={isDocked ? "Expand task" : "Dock task to the side"}
              onClick={() => {
                const nextMode = isDocked ? "fullscreen" : "docked";
                setMode(nextMode);
                writeTaskViewMode(nextMode);
              }}
            >
              {isDocked ? (
                <ExpandIcon size={14} />
              ) : (
                <DockRightIcon size={14} />
              )}
            </PagerButton>
          ) : null}
          <PagerButton
            label="Close task"
            onClick={() => setSelectedTaskId(null)}
          >
            <CloseIcon size={14} />
          </PagerButton>
        </div>
      </header>
      <TaskViewBody
        key={selectedTask.id}
        task={selectedTask}
        tasks={tasks}
        boards={boards}
        stacked={isDocked}
        onUpdate={(body) => updateTask(selectedTask.id, body, { quiet: true })}
        onUpdateStatus={(taskId, status) => updateTaskStatus(taskId, status)}
        onOpenTask={setSelectedTaskId}
        onCreateSubtask={(summary) =>
          createTask(summary, selectedTask.id, {
            areaId: selectedTask.areaId,
            progressStageId: selectedTask.progressStageId,
          })
        }
      />
    </div>
  );
}

function TaskViewBody({
  task,
  tasks,
  boards,
  stacked,
  onUpdate,
  onUpdateStatus,
  onOpenTask,
  onCreateSubtask,
}: {
  task: Task;
  tasks: Task[];
  boards: TaskBoard[];
  stacked: boolean;
  onUpdate: (body: UpdateTaskBody) => void;
  onUpdateStatus: (taskId: string, status: Task["status"]) => void;
  onOpenTask: (taskId: string) => void;
  onCreateSubtask: (summary: string) => void;
}) {
  const [summary, setSummary] = useState(task.summary);
  const [estimationText, setEstimationText] = useState(
    formatEstimation(task.estimation),
  );
  const pendingUpdateRef = useRef<UpdateTaskBody>({});
  const saveTimerRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const boardAxes = useBoardAxes(task.taskBoardId);
  const goalsQuery = useQuery({
    queryKey: ["docs", "goal"],
    queryFn: () => todexClient.docs.list({ type: DocType.GOAL }),
  });
  const areas = boardAxes.data?.areas ?? [];
  const stages = boardAxes.data?.progressStages ?? [];
  const goals = [...(goalsQuery.data ?? [])].sort((left, right) =>
    left.title.localeCompare(right.title),
  );

  function flushPendingUpdate() {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const body = pendingUpdateRef.current;
    if (Object.keys(body).length === 0) return;
    pendingUpdateRef.current = {};
    onUpdateRef.current(body);
  }

  function queueUpdate(body: UpdateTaskBody) {
    pendingUpdateRef.current = { ...pendingUpdateRef.current, ...body };
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      flushPendingUpdate();
    }, SAVE_DEBOUNCE_MS);
  }
  const children = tasks
    .filter((item) => item.parentTaskId === task.id)
    .sort(compareTasksForNavigation);
  const doneCount = children.filter(
    (item) => item.status === TaskStatus.DONE,
  ).length;
  const progress = taskChecklistProgress({
    acceptanceCriteria: task.acceptanceCriteria,
    subtasks: children,
  });
  const descendantIds = collectDescendantIds(tasks, task.id);
  const parentOptions = tasks.filter(
    (item) => item.id !== task.id && !descendantIds.has(item.id),
  );
  const criteriaMet = acceptanceCriteriaAreMet(task.acceptanceCriteria);
  const parsedEstimation = parseEstimation(estimationText);
  const estimationInvalid =
    estimationText.trim() !== "" && parsedEstimation === null;
  const board = boards.find((item) => item.id === task.taskBoardId);
  const boardName = board?.name ?? "Board";

  useEffect(() => {
    return () => {
      flushPendingUpdate();
    };
  }, []);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto",
        stacked ? null : "lg:flex-row lg:overflow-hidden",
      )}
    >
      <div
        className={cn(
          "min-w-0 flex-1 py-6",
          stacked ? "px-4" : "px-6 sm:px-10 lg:overflow-y-auto",
        )}
      >
        <textarea
          aria-label="Summary"
          value={summary}
          rows={2}
          className={cn(
            "w-full resize-none bg-transparent text-2xl font-semibold leading-tight outline-none placeholder:text-muted-foreground",
            task.status === TaskStatus.DONE
              ? "text-muted-foreground line-through"
              : "text-foreground",
          )}
          onChange={(event) => {
            const nextSummary = event.target.value;
            setSummary(nextSummary);
            const trimmed = nextSummary.trim();
            if (trimmed && trimmed !== task.summary) {
              queueUpdate({ summary: trimmed });
            }
          }}
          onBlur={() => {
            const nextSummary = summary.trim();
            if (!nextSummary) {
              setSummary(task.summary);
              const next = { ...pendingUpdateRef.current };
              delete next.summary;
              pendingUpdateRef.current = next;
              return;
            }
            if (nextSummary !== task.summary)
              queueUpdate({ summary: nextSummary });
            flushPendingUpdate();
          }}
        />
        <div className="mt-1">
          <p className="mb-3 text-lg font-medium text-muted-foreground">
            Description
          </p>
          <TaskDescriptionEditor
            appearance="plain"
            content={task.description}
            onChange={(html) => {
              if (html === task.description) return;
              queueUpdate({ description: html });
            }}
          />
        </div>
      </div>
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col gap-3 border-t border-border bg-background p-4",
          stacked
            ? null
            : "lg:w-[22rem] lg:overflow-y-auto lg:border-l lg:border-t-0",
        )}
      >
        <section className="rounded-xl border border-border bg-background p-4">
          <h2 className="text-sm font-medium text-foreground">Task Details</h2>
          <div className="mt-4 flex flex-col gap-3">
            {progress.total > 0 ? (
              <DetailRow icon={<StatusDoneIconMark />} label="Progress">
                <TaskProgressBar
                  done={progress.done}
                  total={progress.total}
                  className="text-sm"
                />
              </DetailRow>
            ) : null}
            <DetailRow
              icon={<StatusGlyph status={task.status} />}
              label="Status"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={task.status}
                  onValueChange={(value) =>
                    onUpdateStatus(task.id, value as Task["status"])
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-7 w-fit gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
                      STATUS_PILL[task.status],
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="flex items-center gap-2">
                          <StatusGlyph status={status} />
                          {STATUS_LABEL[status]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {criteriaMet && task.status !== TaskStatus.DONE ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
                    onClick={() => onUpdateStatus(task.id, TaskStatus.DONE)}
                  >
                    Mark done
                  </button>
                ) : null}
              </div>
            </DetailRow>
            <DetailRow icon={<StageMark />} label="Stage">
              <Select
                value={
                  stages.some((stage) => stage.id === task.progressStageId)
                    ? (task.progressStageId ?? "none")
                    : "none"
                }
                disabled={stages.length === 0}
                onValueChange={(value) =>
                  onUpdate({
                    progressStageId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger
                  className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none disabled:opacity-50"
                  disabled={stages.length === 0}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DetailRow>
            <DetailRow
              icon={<PriorityGlyph priority={task.priority} />}
              label="Priority"
            >
              <Select
                value={task.priority}
                onValueChange={(value) =>
                  queueUpdate({ priority: value as Task["priority"] })
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-7 w-fit gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
                    PRIORITY_PILL[task.priority],
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <span className="flex items-center gap-2">
                        <PriorityGlyph priority={priority} />
                        {PRIORITY_LABEL[priority]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DetailRow>
            <DetailRow icon={<BoardMark />} label="Board">
              {boards.length > 1 ? (
                <Select
                  value={task.taskBoardId}
                  onValueChange={(value) => queueUpdate({ taskBoardId: value })}
                >
                  <SelectTrigger className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">{boardName}</span>
              )}
            </DetailRow>
            <DetailRow icon={<AreaMark />} label="Area">
              {areas.some((area) => area.id === task.areaId) ? (
                <Select
                  value={task.areaId}
                  onValueChange={(value) => onUpdate({ areaId: value })}
                >
                  <SelectTrigger className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-muted-foreground">General</span>
              )}
            </DetailRow>
            <DetailRow icon={<ClockIcon size={16} />} label="Estimate">
              <div className="min-w-0 flex-1">
                <EstimatePicker
                  appearance="plain"
                  value={estimationText}
                  onChange={setEstimationText}
                  onCommit={(next) => {
                    const parsed = parseEstimation(next);
                    const invalid = next.trim() !== "" && parsed === null;
                    if (invalid) return;
                    const nextEstimation = next.trim() ? parsed : null;
                    if (nextEstimation !== task.estimation) {
                      queueUpdate({ estimation: nextEstimation });
                    }
                    flushPendingUpdate();
                  }}
                />
                {estimationInvalid ? (
                  <p className="text-xs text-destructive">Use 1h, 30m, or 2d</p>
                ) : null}
              </div>
            </DetailRow>
            <DetailRow icon={<CalendarIcon size={16} />} label="Schedule">
              <DatePicker
                appearance="plain"
                emptyLabel="None"
                value={isoToDateInput(task.scheduleDate)}
                onChange={(next) =>
                  queueUpdate({
                    scheduleDate: dateInputToLocalDayStartIso(next),
                  })
                }
              />
            </DetailRow>
            <DetailRow icon={<CalendarIcon size={16} />} label="Due">
              <DatePicker
                appearance="plain"
                emptyLabel="None"
                value={isoToDateInput(task.dueDate)}
                onChange={(next) =>
                  queueUpdate({
                    dueDate: dateInputToLocalDayStartIso(next),
                  })
                }
              />
            </DetailRow>
            <DetailRow icon={<RepeatIcon size={16} />} label="Repeat">
              <TaskRecurrencePicker
                recurrence={task.recurrence}
                scheduleDate={task.scheduleDate}
                dueDate={task.dueDate}
                onChange={(recurrence) => {
                  if (
                    recurrence &&
                    task.scheduleDate == null &&
                    task.dueDate == null
                  ) {
                    queueUpdate({
                      recurrence,
                      scheduleDate: startOfLocalDay().toISOString(),
                    });
                  } else {
                    queueUpdate({ recurrence });
                  }
                  flushPendingUpdate();
                }}
              />
            </DetailRow>
            <DetailRow icon={<StatusDoneIcon size={16} />} label="Goal">
              <Select
                value={task.goalId ?? "none"}
                onValueChange={(value) => {
                  queueUpdate({ goalId: value === "none" ? null : value });
                  flushPendingUpdate();
                }}
              >
                <SelectTrigger className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {task.goalId &&
                  !goals.some((goal) => goal.id === task.goalId) ? (
                    <SelectItem value={task.goalId}>Goal</SelectItem>
                  ) : null}
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DetailRow>
            <DetailRow icon={<ParentMark />} label="Parent">
              <Select
                value={task.parentTaskId ?? "none"}
                onValueChange={(value) =>
                  queueUpdate({ parentTaskId: value === "none" ? null : value })
                }
              >
                <SelectTrigger className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.taskKey} {item.summary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DetailRow>
          </div>
        </section>
        <AcceptanceCriteriaSection
          criteria={task.acceptanceCriteria}
          onChange={(acceptanceCriteria) => onUpdate({ acceptanceCriteria })}
        />
        <SubtasksSection
          tasks={children}
          doneCount={doneCount}
          onOpenTask={onOpenTask}
          onUpdateStatus={onUpdateStatus}
          onCreateSubtask={onCreateSubtask}
        />
      </aside>
    </div>
  );
}

function AcceptanceCriteriaSection({
  criteria,
  onChange,
}: {
  criteria: AcceptanceCriterion[];
  onChange: (criteria: AcceptanceCriterion[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const doneCount = criteria.filter((criterion) => criterion.done).length;

  function addCriterion(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([
      ...criteria,
      { id: crypto.randomUUID(), text: trimmed, done: false },
    ]);
    setDraft("");
  }

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">
          Acceptance criteria
        </h2>
        {criteria.length > 0 ? (
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {doneCount}/{criteria.length}
          </span>
        ) : null}
      </div>
      {criteria.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {criteria.map((criterion) => (
            <AcceptanceCriterionRow
              key={criterion.id}
              criterion={criterion}
              onToggle={(done) =>
                onChange(
                  criteria.map((item) =>
                    item.id === criterion.id ? { ...item, done } : item,
                  ),
                )
              }
              onRename={(text) =>
                onChange(
                  criteria.map((item) =>
                    item.id === criterion.id ? { ...item, text } : item,
                  ),
                )
              }
              onRemove={() =>
                onChange(criteria.filter((item) => item.id !== criterion.id))
              }
            />
          ))}
        </ul>
      ) : null}
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addCriterion(draft);
        }}
      >
        <PlusIcon size={14} className="shrink-0 text-muted-foreground" />
        <input
          aria-label="Add acceptance criterion"
          value={draft}
          placeholder="Add criterion"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>
    </section>
  );
}

function AcceptanceCriterionRow({
  criterion,
  onToggle,
  onRename,
  onRemove,
}: {
  criterion: AcceptanceCriterion;
  onToggle: (done: boolean) => void;
  onRename: (text: string) => void;
  onRemove: () => void;
}) {
  const [text, setText] = useState(criterion.text);

  return (
    <li className="flex items-start gap-2">
      <Checkbox
        checked={criterion.done}
        aria-label={`Mark "${criterion.text}" done`}
        className="mt-0.5"
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      <input
        aria-label="Criterion"
        value={text}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm outline-none",
          criterion.done
            ? "text-muted-foreground line-through"
            : "text-foreground",
        )}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          const trimmed = text.trim();
          if (!trimmed) {
            setText(criterion.text);
            return;
          }
          if (trimmed !== criterion.text) onRename(trimmed);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        aria-label={`Remove "${criterion.text}"`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-surface hover:text-foreground"
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  );
}

function SubtasksSection({
  tasks,
  doneCount,
  onOpenTask,
  onUpdateStatus,
  onCreateSubtask,
}: {
  tasks: Task[];
  doneCount: number;
  onOpenTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: Task["status"]) => void;
  onCreateSubtask: (summary: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronIcon
          size={14}
          className={cn(
            "text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <h2 className="text-sm font-medium text-foreground">Subtasks</h2>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {doneCount}/{tasks.length}
        </span>
      </button>
      {open ? (
        tasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No subtasks</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {tasks.map((child) => (
              <li key={child.id} className="flex items-start gap-2">
                <Checkbox
                  checked={child.status === TaskStatus.DONE}
                  aria-label={`Mark ${child.summary} done`}
                  className="mt-0.5"
                  onCheckedChange={(checked) =>
                    onUpdateStatus(
                      child.id,
                      checked === true ? TaskStatus.DONE : TaskStatus.TODO,
                    )
                  }
                />
                <button
                  type="button"
                  className={cn(
                    "min-w-0 flex-1 text-left text-sm hover:text-foreground",
                    child.status === TaskStatus.DONE
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                  onClick={() => onOpenTask(child.id)}
                >
                  {child.summary}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
      <SubtaskComposer
        onCreate={(summary) => {
          onCreateSubtask(summary);
          setOpen(true);
        }}
      />
    </section>
  );
}

function SubtaskComposer({
  onCreate,
}: {
  onCreate: (summary: string) => void;
}) {
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextSummary = summary.trim();
    if (!nextSummary) return;
    onCreate(nextSummary);
    setSummary("");
  }

  return (
    <form className="mt-3 flex items-center gap-2" onSubmit={handleSubmit}>
      <PlusIcon size={14} className="shrink-0 text-muted-foreground" />
      <input
        aria-label="Add subtask"
        value={summary}
        placeholder="Add subtask"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => setSummary(event.target.value)}
      />
    </form>
  );
}

function TaskViewMenu({
  summary,
  onDelete,
}: {
  summary: string;
  onDelete: () => void;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Task actions"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <EllipsisIcon size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isDeleteOpen ? (
        <ConfirmDialog
          title="Delete task"
          description={`Delete "${summary}"?`}
          confirmLabel="Delete"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </>
  );
}

function useMinWidthLg() {
  const [matches, setMatches] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(LG_QUERY);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return matches;
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-28 shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function StatusDoneIconMark() {
  return (
    <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400" />
  );
}

function compareTasksForNavigation(left: Task, right: Task): number {
  const createdDelta = left.createdAt.localeCompare(right.createdAt);
  if (createdDelta !== 0) return createdDelta;
  return left.taskKey.localeCompare(right.taskKey);
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

const STATUS_PILL: Record<Task["status"], string> = {
  [TaskStatus.TODO]: "border-transparent bg-amber-400/15 text-amber-200",
  [TaskStatus.IN_PROGRESS]: "border-transparent bg-sky-400/15 text-sky-200",
  [TaskStatus.DONE]: "border-transparent bg-emerald-400/15 text-emerald-200",
};

const PRIORITY_PILL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "border-transparent bg-surface text-muted-foreground",
  [TaskPriority.MEDIUM]: "border-transparent bg-sky-400/10 text-sky-200",
  [TaskPriority.HIGH]: "border-transparent bg-orange-400/15 text-orange-200",
  [TaskPriority.CRITICAL]: "border-transparent bg-red-500/15 text-red-200",
};
