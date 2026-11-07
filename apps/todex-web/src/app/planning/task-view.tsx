"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
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
  Epic,
  Task,
  Space,
  UpdateEpicBody,
  UpdateTaskBody,
} from "@repo/api/todex";

type TaskPatch = Omit<UpdateTaskBody, "version">;

import { ResizeHandle } from "@components/resize-handle";
import { useExecutionCommands } from "../execution/execution-commands";
import { formatDuration } from "../execution/execution-time";
import {
  BarsIcon,
  CalendarClockIcon,
  CalendarIcon,
  ChevronIcon,
  CircleDashedIcon,
  ClockIcon,
  CloseIcon,
  DockRightIcon,
  EllipsisIcon,
  ExpandIcon,
  ExternalLinkIcon,
  BoxIcon,
  FileTextIcon,
  FolderIcon,
  GaugeIcon,
  GitBranchIcon,
  GoalIcon,
  HourglassIcon,
  InfoIcon,
  LayersIcon,
  MessageSquareIcon,
  MilestoneIcon,
  PlusIcon,
  RepeatIcon,
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
  PriorityGlyph,
  StatusGlyph,
  TaskProgressBar,
  TasksBreadcrumb,
} from "./task-board.ui";
import { EpicTaskCard } from "./epic-row";
import { TaskComposer, type TaskComposerValues } from "./task-composer";
import {
  combineLocalDateAndTime,
  dateInputToLocalDayStartIso,
  dateInputToScheduleIso,
  isoToDateInput,
  isoToLocalTimeInput,
  isClosedStatus,
  statusAfterDoneToggle,
  directSubtaskCounts,
  taskProgressPercent,
  STATUS_LABEL,
  STATUS_ORDER,
} from "./task-helpers";
import { collectDescendantIds } from "./task-selection";
import { useTasks } from "./tasks-provider";

const SAVE_DEBOUNCE_MS = 600;
const LG_QUERY = "(min-width: 1024px)";

export function TaskView() {
  const pathname = usePathname();
  const openedEpic = openedEpicFromPathname(pathname);
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
  const { execute, enqueue } = useExecutionCommands();
  const isLargeScreen = useMinWidthLg();
  const [mode, setMode] = useState<TaskViewMode>("docked");
  const [panelWidth, setPanelWidth] = useState(TASK_PANEL_DEFAULT_WIDTH);

  useEffect(() => {
    setMode(readTaskViewMode());
    setPanelWidth(readTaskPanelWidth());
  }, []);

  if (openedEpic) {
    return (
      <OpenedEpicView
        spaceId={openedEpic.spaceId}
        epicId={openedEpic.epicId}
        isLargeScreen={isLargeScreen}
        mode={mode}
        panelWidth={panelWidth}
        onMode={setMode}
        onWidth={setPanelWidth}
      />
    );
  }

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

  const board = boards.find((item) => item.id === selectedTask.spaceId);
  const spaceName = board?.name ?? "Space";

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
            spaceName={spaceName}
            boardHref={
              board
                ? tasksUrlHelper.routing.buildBoardUrl(board.id)
                : undefined
            }
            taskKey={selectedTask.taskKey}
            trailing={<BoardGlyph />}
          />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={() => execute(selectedTask.id)}>
            Execute
          </Button>
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
            onEnqueue={() => enqueue(selectedTask.id)}
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
        onCreateSubtask={(values) =>
          createTask(values.summary, selectedTask.id, {
            estimation: values.estimation,
            status: values.status,
            priority: values.priority,
            spaceId: selectedTask.spaceId,
            sectionId: selectedTask.sectionId,
            epicId: selectedTask.epicId,
            scheduleDate: values.scheduleDate,
            dueDate: values.dueDate,
            progressStageId: selectedTask.progressStageId,
          })
        }
      />
    </div>
  );
}

function OpenedEpicView({
  spaceId,
  epicId,
  isLargeScreen,
  mode,
  panelWidth,
  onMode,
  onWidth,
}: {
  spaceId: string;
  epicId: string;
  isLargeScreen: boolean;
  mode: TaskViewMode;
  panelWidth: number;
  onMode: (mode: TaskViewMode) => void;
  onWidth: (width: number) => void;
}) {
  const {
    state: { boards },
    actions: { setSelectedTaskId },
  } = useTasks();
  const isDocked = isLargeScreen && mode === "docked";
  const epicQuery = useQuery({
    queryKey: ["epic", epicId],
    queryFn: () => todexClient.epics.get(epicId),
  });
  const spaceName =
    boards.find((board) => board.id === spaceId)?.name ?? "Space";
  const spaceHref = tasksUrlHelper.routing.buildBoardUrl(spaceId);

  function close() {
    setSelectedTaskId(null);
  }

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
          onWidth={onWidth}
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
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
            {epicQuery.data?.epic.name ?? "Epic"}
          </span>
        ) : (
          <TasksBreadcrumb
            className="min-w-0 flex-1 text-2xl font-semibold tracking-tight"
            spaceName={spaceName}
            boardHref={spaceHref}
            epicName={epicQuery.data?.epic.name ?? "Epic"}
            trailing={<BoardGlyph />}
          />
        )}
        <div className="flex shrink-0 items-center gap-1">
          {epicQuery.data ? (
            <EpicViewMenu
              name={epicQuery.data.epic.name}
              onDelete={async () => {
                await todexClient.epics.remove(epicId);
                close();
              }}
            />
          ) : null}
          {isLargeScreen ? (
            <PagerButton
              label={isDocked ? "Expand epic" : "Dock epic to the side"}
              onClick={() => {
                const nextMode = isDocked ? "fullscreen" : "docked";
                onMode(nextMode);
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
          <PagerButton label="Close epic" onClick={close}>
            <CloseIcon size={14} />
          </PagerButton>
        </div>
      </header>
      {epicQuery.isLoading ? null : epicQuery.isError || !epicQuery.data ? (
        <p className="px-6 py-10 text-sm text-destructive">
          Could not load epic.
        </p>
      ) : (
        <OpenedEpicBody
          key={epicQuery.data.epic.id}
          epic={epicQuery.data.epic}
          spaceName={spaceName}
          stacked={isDocked}
        />
      )}
    </div>
  );
}

function OpenedEpicBody({
  epic,
  spaceName,
  stacked,
}: {
  epic: Epic;
  spaceName: string;
  stacked: boolean;
}) {
  const queryClient = useQueryClient();
  const {
    state: { tasks },
    actions: { createTask },
  } = useTasks();
  const [name, setName] = useState(epic.name);
  const [addingTask, setAddingTask] = useState(false);
  const sections = useBoardAxes(epic.spaceId).data?.sections ?? [];
  const pendingUpdateRef = useRef<UpdateEpicBody>({});
  const saveTimerRef = useRef<number | null>(null);
  const epicTasks = tasks
    .filter((task) => task.epicId === epic.id && task.parentTaskId == null)
    .sort(compareTasksForNavigation);
  const assigned = tasks.filter((task) => task.epicId === epic.id);
  const completed = assigned.filter(
    (task) => task.status === TaskStatus.DONE,
  ).length;
  const listedDone = epicTasks.filter(
    (task) => task.status === TaskStatus.DONE,
  ).length;
  const updateEpic = useMutation({
    mutationFn: (body: UpdateEpicBody) =>
      todexClient.epics.update(epic.id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["epic", epic.id] });
      await queryClient.invalidateQueries({
        queryKey: ["epics", epic.spaceId],
      });
    },
  });

  function flushPendingUpdate() {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const body = pendingUpdateRef.current;
    if (Object.keys(body).length === 0) return;
    pendingUpdateRef.current = {};
    updateEpic.mutate(body);
  }

  function queueUpdate(body: UpdateEpicBody) {
    pendingUpdateRef.current = { ...pendingUpdateRef.current, ...body };
    if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      flushPendingUpdate();
    }, SAVE_DEBOUNCE_MS);
  }

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
          aria-label="Name"
          value={name}
          rows={2}
          className="w-full resize-none bg-transparent text-2xl font-semibold leading-tight text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            const trimmed = nextName.trim();
            if (trimmed && trimmed !== epic.name)
              queueUpdate({ name: trimmed });
          }}
          onBlur={() => {
            const nextName = name.trim();
            if (!nextName) {
              setName(epic.name);
              return;
            }
            if (nextName !== epic.name) queueUpdate({ name: nextName });
            flushPendingUpdate();
          }}
        />
        <div className="mt-1">
          <p className="mb-3 text-lg font-medium text-muted-foreground">
            Description
          </p>
          <TaskDescriptionEditor
            appearance="plain"
            content={epic.description}
            onChange={(html) => {
              if (html === epic.description) return;
              queueUpdate({ description: html });
            }}
          />
        </div>
        <section className="mt-8">
          <div className="mb-3 flex items-center">
            <h2 className="text-lg font-medium text-muted-foreground">Tasks</h2>
            <span className="ml-auto text-sm font-medium tabular-nums text-muted-foreground">
              {listedDone}/{epicTasks.length}
            </span>
          </div>
          {epicTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {epicTasks.map((task) => (
                <EpicTaskCard key={task.id} task={task} draggable={false} />
              ))}
            </div>
          )}
          <div className="mt-2">
            <TaskComposer
              open={addingTask}
              defaultBoardId={epic.spaceId}
              onOpenChange={setAddingTask}
              onCreate={(values) =>
                createTask(values.summary, null, {
                  estimation: values.estimation,
                  status: values.status,
                  priority: values.priority,
                  spaceId: epic.spaceId,
                  sectionId: epic.sectionId,
                  epicId: epic.id,
                  scheduleDate: values.scheduleDate,
                  dueDate: values.dueDate,
                })
              }
            />
          </div>
        </section>
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
          <h2 className="text-sm font-medium text-foreground">Details</h2>
          <div className="mt-4 flex flex-col gap-3">
            <DetailRow icon={<StatusDoneIconMark />} label="Progress">
              <TaskProgressBar
                done={completed}
                total={assigned.length}
                className="text-sm"
              />
            </DetailRow>
            <DetailRow
              icon={<StatusGlyph status={epic.status} />}
              label="Status"
            >
              <Select
                value={epic.status}
                onValueChange={(value) =>
                  updateEpic.mutate({ status: value as Task["status"] })
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-7 w-fit gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
                    STATUS_PILL[epic.status],
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
            </DetailRow>
            <DetailRow
              icon={<PriorityGlyph priority={epic.priority} />}
              label="Priority"
            >
              <Select
                value={epic.priority}
                onValueChange={(value) =>
                  updateEpic.mutate({ priority: value as Task["priority"] })
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-7 w-fit gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
                    PRIORITY_PILL[epic.priority],
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
            <DetailRow icon={<BoardMark />} label="Space">
              <span className="text-sm">{spaceName}</span>
            </DetailRow>
            <DetailRow icon={<AreaMark />} label="Section">
              {sections.some((section) => section.id === epic.sectionId) ? (
                <Select
                  value={epic.sectionId}
                  onValueChange={(sectionId) =>
                    updateEpic.mutate({ sectionId })
                  }
                >
                  <SelectTrigger className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-muted-foreground">General</span>
              )}
            </DetailRow>
          </div>
        </section>
      </aside>
    </div>
  );
}

function EpicViewMenu({
  name,
  onDelete,
}: {
  name: string;
  onDelete: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Epic actions"
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
          title="Delete epic"
          description={`Delete "${name}"? Its tasks stay in the space.`}
          confirmLabel="Delete"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={async () => {
            await onDelete();
            await queryClient.invalidateQueries({ queryKey: ["epics"] });
            await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          }}
        />
      ) : null}
    </>
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
  boards: Space[];
  stacked: boolean;
  onUpdate: (body: TaskPatch) => void;
  onUpdateStatus: (taskId: string, status: Task["status"]) => void;
  onOpenTask: (taskId: string) => void;
  onCreateSubtask: (values: TaskComposerValues) => void;
}) {
  const [summary, setSummary] = useState(task.summary);
  const [outcome, setOutcome] = useState(task.outcome);
  const [estimationText, setEstimationText] = useState(
    formatEstimation(task.estimation),
  );
  const pendingUpdateRef = useRef<TaskPatch>({});
  const saveTimerRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const boardAxes = useBoardAxes(task.spaceId);
  const goalsQuery = useQuery({
    queryKey: ["docs", "goal"],
    queryFn: () => todexClient.docs.list({ type: DocType.GOAL }),
  });
  const areas = boardAxes.data?.sections ?? [];
  const epicsQuery = useQuery({
    queryKey: ["epics", task.spaceId],
    queryFn: () => todexClient.epics.list(task.spaceId),
  });
  const epics = epicsQuery.data ?? [];
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

  function queueUpdate(body: TaskPatch) {
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
  const progressPercent = Math.round(
    taskProgressPercent({
      status: task.status,
      acceptanceCriteria: task.acceptanceCriteria,
      subtasks: children,
    }) * 100,
  );
  const subtaskCounts = directSubtaskCounts(children);
  const criteriaMetCount = task.acceptanceCriteria.filter(
    (criterion) => criterion.done,
  ).length;
  const descendantIds = collectDescendantIds(tasks, task.id);
  const parentOptions = tasks.filter(
    (item) =>
      item.id !== task.id &&
      item.parentTaskId == null &&
      !descendantIds.has(item.id),
  );
  const parsedEstimation = parseEstimation(estimationText);
  const estimationInvalid =
    estimationText.trim() === "" ||
    parsedEstimation == null ||
    parsedEstimation <= 0;
  const board = boards.find((item) => item.id === task.spaceId);
  const spaceName = board?.name ?? "Space";
  const activeSlots = task.scheduleSlots.filter((slot) => slot.retiredAt == null);
  const activeSlot = [...activeSlots].sort((left, right) =>
    left.startAt.localeCompare(right.startAt),
  )[0];
  const [sectionsOpen, setSectionsOpen] = useState({
    criteria: task.acceptanceCriteria.length > 0,
    subtasks: true,
    progress: true,
    execution: true,
    organization: true,
    timeline:
      activeSlot != null ||
      task.dueDate != null ||
      task.recurrence != null ||
      task.seriesId != null,
  });
  const timeUsedPercent =
    task.estimation > 0
      ? Math.round((task.actualTime / (task.estimation * 60)) * 100)
      : 0;
  const subtaskExecuted = children.reduce(
    (total, child) => total + child.actualTime,
    0,
  );

  function toggleSection(key: keyof typeof sectionsOpen) {
    setSectionsOpen((current) => ({ ...current, [key]: !current[key] }));
  }

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
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === TaskStatus.DONE}
            aria-label="Mark task done"
            className="mt-2"
            onCheckedChange={() =>
              onUpdateStatus(task.id, statusAfterDoneToggle(task.status))
            }
          />
          <textarea
          aria-label="Summary"
          value={summary}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent text-2xl font-semibold leading-tight outline-none placeholder:text-muted-foreground",
            isClosedStatus(task.status)
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
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
          <Select
            value={task.status}
            onValueChange={(value) =>
              onUpdateStatus(task.id, value as Task["status"])
            }
          >
            <SelectTrigger
              className={cn(
                CHIP,
                STATUS_PILL[task.status],
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0 rounded-full border-[1.5px]",
                  task.status === TaskStatus.TODO && "border-amber-500",
                  task.status === TaskStatus.IN_PROGRESS &&
                    "border-sky-300 bg-sky-400/50",
                  task.status === TaskStatus.DONE &&
                    "border-emerald-300 bg-emerald-400",
                  task.status === TaskStatus.CANCELLED && "border-zinc-400",
                )}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={task.priority}
            onValueChange={(value) =>
              queueUpdate({ priority: value as Task["priority"] })
            }
          >
            <SelectTrigger className={cn(CHIP, PRIORITY_PILL[task.priority])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-xs text-foreground/90">
            <ClockIcon size={13} />
            Est. {formatEstimation(task.estimation)}
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-xs text-foreground/90">
            <BarsIcon size={13} />
            Progress {progressPercent}%
          </span>
        </div>
        <label className="mt-6 block">
          <span className="mb-1.5 block text-sm font-semibold">Outcome</span>
          <textarea
            aria-label="Outcome"
            value={outcome}
            rows={1}
            maxLength={500}
            placeholder="Add an outcome before you execute."
            className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            onChange={(event) => {
              const nextOutcome = event.target.value;
              setOutcome(nextOutcome);
              queueUpdate({ outcome: nextOutcome.trim() });
            }}
            onBlur={() => flushPendingUpdate()}
          />
        </label>
        <div className="mt-6">
          <p className="mb-1.5 text-sm font-semibold">Description</p>
          <TaskDescriptionEditor
            appearance="plain"
            contentClassName="min-h-0"
            content={task.description}
            onChange={(html) => {
              if (html === task.description) return;
              queueUpdate({ description: html });
            }}
          />
        </div>
        <Fold
          title="Acceptance Criteria"
          count={`${criteriaMetCount}/${task.acceptanceCriteria.length}`}
          open={sectionsOpen.criteria}
          onToggle={() => toggleSection("criteria")}
        >
          <AcceptanceCriteriaSection
            criteria={task.acceptanceCriteria}
            onChange={(acceptanceCriteria) => {
              if (task.acceptanceCriteria.length === 0 && acceptanceCriteria.length > 0) {
                setSectionsOpen((current) => ({ ...current, criteria: true }));
              }
              onUpdate({ acceptanceCriteria });
            }}
          />
        </Fold>
        <Fold
          title="Subtasks"
          count={`${subtaskCounts.done}/${children.length}`}
          open={sectionsOpen.subtasks}
          onToggle={() => toggleSection("subtasks")}
        >
          <SubtasksSection
            subtasks={children}
            canAdd={task.parentTaskId == null}
            onToggleDone={(subtask) =>
              onUpdateStatus(subtask.id, statusAfterDoneToggle(subtask.status))
            }
            onOpen={onOpenTask}
            onCreate={(summary) =>
              onCreateSubtask({
                summary,
                status: TaskStatus.TODO,
                priority: task.priority,
                estimation: task.estimation,
                spaceId: task.spaceId,
                scheduleDate: null,
                dueDate: null,
              })
            }
          />
        </Fold>
        <TaskReferences taskId={task.id} />
      </div>
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col gap-3 border-t border-border bg-background p-4",
          stacked
            ? null
            : "lg:w-[22rem] lg:overflow-y-auto lg:border-l lg:border-t-0",
        )}
      >
        <SideGroup
          title="Progress"
          open={sectionsOpen.progress}
          onToggle={() => toggleSection("progress")}
        >
          <div className="py-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              <CircleDashedIcon size={15} className="text-muted-foreground" />
              <span>Task Progress</span>
              <InfoIcon size={13} className="text-muted-foreground" />
              <span className="ml-auto text-sm font-medium tabular-nums">
                {progressPercent}%
              </span>
            </div>
            <Meter value={progressPercent} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Subtasks: {subtaskCounts.done}/{subtaskCounts.remaining}
              {" · "}
              Acceptance criteria: {criteriaMetCount}/{task.acceptanceCriteria.length}
              {subtaskCounts.cancelled > 0
                ? ` · ${subtaskCounts.cancelled} cancelled`
                : ""}
            </p>
          </div>
          <div className="py-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              <ClockIcon size={15} className="text-muted-foreground" />
              <span>Time Used</span>
              <InfoIcon size={13} className="text-muted-foreground" />
              <span className="ml-auto text-sm font-medium tabular-nums">
                {timeUsedPercent}%
              </span>
            </div>
            <Meter value={timeUsedPercent} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {executedLabel(task.actualTime)} executed /{" "}
              {formatEstimation(task.estimation)} estimated
            </p>
            {children.length > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Subtasks {executedLabel(subtaskExecuted)}
              </p>
            ) : null}
          </div>
        </SideGroup>
        <SideGroup
          title="Execution"
          open={sectionsOpen.execution}
          onToggle={() => toggleSection("execution")}
        >
          <DetailRow icon={<HourglassIcon size={16} />} label="Estimation">
            <div className="min-w-0">
              <EstimatePicker
                appearance="plain"
                value={estimationText}
                onChange={setEstimationText}
                onCommit={(next) => {
                  const parsed = parseEstimation(next);
                  if (parsed == null || parsed <= 0) {
                    setEstimationText(formatEstimation(task.estimation));
                    return;
                  }
                  if (parsed !== task.estimation) {
                    queueUpdate({ estimation: parsed });
                  }
                  flushPendingUpdate();
                }}
              />
              {estimationInvalid ? (
                <p className="text-xs text-destructive">
                  {estimationText.trim() && parsedEstimation === null
                    ? "Use 1h, 30m, or 2d"
                    : "Estimate is required"}
                </p>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow icon={<ClockIcon size={16} />} label="Executed">
            <span>{executedLabel(task.actualTime)}</span>
          </DetailRow>
          <DetailRow icon={<MilestoneIcon size={16} />} label="Progress Stage">
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
                className={cn(VALUE, "disabled:opacity-50")}
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
          <DetailRow icon={<GaugeIcon size={16} />} label="Complexity">
            <Select
              value={task.complexity ?? "none"}
              onValueChange={(value) =>
                queueUpdate({
                  complexity:
                    value === "none" ? null : (value as Task["complexity"]),
                })
              }
            >
              <SelectTrigger className={VALUE}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </DetailRow>
        </SideGroup>
        <SideGroup
          title="Organization"
          open={sectionsOpen.organization}
          onToggle={() => toggleSection("organization")}
        >
          <DetailRow icon={<BoxIcon size={16} />} label="Space">
            {boards.length > 1 ? (
              <Select
                value={task.spaceId}
                onValueChange={(value) => {
                  queueUpdate({
                    spaceId: value,
                    epicId: null,
                  });
                  flushPendingUpdate();
                }}
              >
                <SelectTrigger className={VALUE}>
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
              <span>{spaceName}</span>
            )}
          </DetailRow>
          <DetailRow icon={<LayersIcon size={16} />} label="Section">
            {areas.some((area) => area.id === task.sectionId) ? (
              <Select
                value={task.sectionId}
                onValueChange={(value) => onUpdate({ sectionId: value })}
              >
                <SelectTrigger className={VALUE}>
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
              <span>General</span>
            )}
          </DetailRow>
          <DetailRow icon={<FolderIcon size={16} />} label="Epic">
            <Select
              value={task.epicId ?? "none"}
              onValueChange={(value) => {
                queueUpdate({ epicId: value === "none" ? null : value });
                flushPendingUpdate();
              }}
            >
              <SelectTrigger className={VALUE}>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailRow>
          <DetailRow icon={<GoalIcon size={16} />} label="Goal">
            <div className="flex min-w-0 items-center gap-2">
              <Select
                value={task.goalId ?? "none"}
                onValueChange={(value) => {
                  queueUpdate({ goalId: value === "none" ? null : value });
                  flushPendingUpdate();
                }}
              >
                <SelectTrigger className={VALUE}>
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
              {task.goalId ? (
                <Link
                  href={`/planning/goals/${task.goalId}`}
                  className="shrink-0 text-xs text-muted-foreground hover:underline"
                >
                  Open
                </Link>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow icon={<GitBranchIcon size={16} />} label="Parent">
            <Select
              value={task.parentTaskId ?? "none"}
              onValueChange={(value) =>
                queueUpdate({ parentTaskId: value === "none" ? null : value })
              }
            >
              <SelectTrigger className={VALUE}>
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
        </SideGroup>
        <SideGroup
          title="Timeline"
          open={sectionsOpen.timeline}
          onToggle={() => toggleSection("timeline")}
        >
          <DetailRow icon={<CalendarIcon size={16} />} label="Schedule">
            <div className="inline-flex h-7 items-center gap-1 rounded-md bg-white/10 px-2">
                <DatePicker
                  appearance="plain"
                  emptyLabel="None"
                  triggerClassName="h-7 px-0 font-medium"
                  value={isoToDateInput(activeSlot?.startAt ?? null)}
                  onChange={(next) => {
                    if (!next) {
                      queueUpdate({ scheduleSlots: [] });
                      return;
                    }
                    const time =
                      isoToLocalTimeInput(activeSlot?.startAt ?? null) ||
                      "09:00";
                    const startAt = dateInputToScheduleIso(next, time);
                    if (!startAt) return;
                    queueUpdate({
                      scheduleSlots: [
                        {
                          startAt,
                          endAt: new Date(
                            Date.parse(startAt) + 60 * 60_000,
                          ).toISOString(),
                        },
                      ],
                    });
                  }}
                />
                <input
                  type="time"
                  aria-label="Schedule time"
                  value={isoToLocalTimeInput(activeSlot?.startAt ?? null)}
                  disabled={!activeSlot}
                  className="w-[4.6rem] bg-transparent text-sm font-medium text-foreground disabled:hidden"
                  onChange={(event) => {
                    const date = isoToDateInput(activeSlot?.startAt ?? null);
                    const startAt = event.target.value
                      ? combineLocalDateAndTime(date, event.target.value)
                      : dateInputToLocalDayStartIso(date);
                    if (!startAt) {
                      queueUpdate({ scheduleSlots: [] });
                      return;
                    }
                    queueUpdate({
                      scheduleSlots: [
                        {
                          startAt,
                          endAt: new Date(
                            Date.parse(startAt) + 60 * 60_000,
                          ).toISOString(),
                        },
                      ],
                    });
                  }}
                />
                {activeSlot ? (
                  <span className="text-muted-foreground">
                    –{" "}
                    {new Date(activeSlot.endAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                ) : null}
            </div>
          </DetailRow>
          <DetailRow icon={<CalendarClockIcon size={16} />} label="Due">
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
          {task.parentTaskId == null ? (
            <DetailRow icon={<RepeatIcon size={16} />} label="Repeat">
              <TaskRecurrencePicker
                recurrence={task.recurrence}
                scheduleDate={activeSlot?.startAt ?? null}
                dueDate={task.dueDate}
                onChange={(recurrence) => {
                  queueUpdate({ recurrence });
                  flushPendingUpdate();
                }}
              />
            </DetailRow>
          ) : null}
        </SideGroup>
      </aside>
    </div>
  );
}

function TaskReferences({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const referencesQuery = useQuery({
    queryKey: ["task-references", taskId],
    queryFn: () => todexClient.tasks.references.list(taskId),
  });
  const createReference = useMutation({
    mutationFn: (nextUrl: string) =>
      todexClient.tasks.references.create(taskId, { kind: "url", url: nextUrl }),
    onSuccess: () => {
      setUrl("");
      void queryClient.invalidateQueries({
        queryKey: ["task-references", taskId],
      });
    },
  });
  const references = referencesQuery.data ?? [];
  const [open, setOpen] = useState<boolean | null>(null);
  const visible = open ?? references.length > 0;

  return (
    <Fold
      title="References"
      count={String(references.length)}
      open={visible}
      onToggle={() => setOpen(!visible)}
    >
      {references.length > 0 ? (
        <ul className="mb-2 flex flex-col gap-2">
          {references.map((reference) => (
            <li
              key={reference.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-muted-foreground">
                {reference.kind === "conversation" ? (
                  <MessageSquareIcon size={16} />
                ) : (
                  <FileTextIcon size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{reference.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {reference.kind === "conversation"
                    ? "Conversation · External"
                    : reference.kind === "url"
                      ? "Link"
                      : "Knowledge Document · Todex"}
                </span>
              </span>
              {reference.url ? (
                <a
                  href={reference.url}
                  aria-label="Open reference"
                  className="text-muted-foreground hover:text-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLinkIcon size={14} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const nextUrl = url.trim();
          if (!nextUrl) return;
          createReference.mutate(nextUrl);
        }}
      >
        <input
          aria-label="Reference URL"
          value={url}
          placeholder="https://"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none"
          onChange={(event) => setUrl(event.target.value)}
        />
        <Button type="submit" size="sm" variant="ghost">
          Add
        </Button>
      </form>
    </Fold>
  );
}

function SubtasksSection({
  subtasks,
  canAdd,
  onToggleDone,
  onOpen,
  onCreate,
}: {
  subtasks: Task[];
  canAdd: boolean;
  onToggleDone: (subtask: Task) => void;
  onOpen: (taskId: string) => void;
  onCreate: (summary: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function addSubtask(summary: string) {
    const trimmed = summary.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setDraft("");
  }

  return (
    <div>
      {subtasks.length > 0 ? (
        <ul className="flex flex-col">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2 py-1">
              <Checkbox
                checked={subtask.status === TaskStatus.DONE}
                aria-label={`Mark "${subtask.summary}" done`}
                onCheckedChange={() => onToggleDone(subtask)}
              />
              <button
                type="button"
                className={cn(
                  "min-w-0 flex-1 truncate text-left text-sm",
                  subtask.status === TaskStatus.DONE
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
                )}
                onClick={() => onOpen(subtask.id)}
              >
                {subtask.summary}
              </button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatEstimation(subtask.estimation)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {canAdd ? (
        <form
          className="mt-1 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addSubtask(draft);
          }}
        >
          <PlusIcon size={14} className="shrink-0 text-muted-foreground" />
          <input
            aria-label="Add subtask"
            value={draft}
            placeholder="Add subtask"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => setDraft(event.target.value)}
          />
        </form>
      ) : null}
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
    <div>
      {criteria.length > 0 ? (
        <ul className="flex flex-col">
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
        className="mt-1 flex items-center gap-2"
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
    </div>
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

function TaskViewMenu({
  summary,
  onEnqueue,
  onDelete,
}: {
  summary: string;
  onEnqueue: () => void;
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
          <DropdownMenuItem onSelect={onEnqueue}>
            Add to Execution Queue
          </DropdownMenuItem>
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

function Fold({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm font-semibold"
        onClick={onToggle}
      >
        <ChevronIcon
          size={14}
          className={cn("text-muted-foreground", open && "rotate-90")}
        />
        {title}
        {count != null ? (
          <span className="font-normal text-muted-foreground">({count})</span>
        ) : null}
      </button>
      {open ? <div className="mt-2 pl-5">{children}</div> : null}
    </section>
  );
}

function SideGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background">
      <button
        type="button"
        className="flex w-full items-center px-3.5 py-2.5 text-sm font-medium"
        onClick={onToggle}
      >
        {title}
        <ChevronIcon
          size={16}
          className={cn(
            "ml-auto text-muted-foreground transition-transform",
            open ? "-rotate-90" : "rotate-90",
          )}
        />
      </button>
      {open ? <div className="flex flex-col px-4 pb-2">{children}</div> : null}
    </section>
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
    <div className="flex min-h-9 items-center gap-2.5">
      <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="ml-auto flex min-w-0 items-center justify-end text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

function Meter({ value }: { value: number }) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
      <div
        className="h-full rounded-full bg-zinc-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function executedLabel(seconds: number) {
  if (seconds <= 0) return "0m";
  return formatDuration(seconds);
}

function StatusDoneIconMark() {
  return (
    <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400" />
  );
}

function openedEpicFromPathname(pathname: string) {
  const match = pathname.match(/^\/planning\/space\/(.+)$/);
  if (!match?.[1]) return null;
  const parsed = tasksUrlHelper.routing.parseSpacePath(
    match[1].split("/").filter(Boolean),
  );
  if (!parsed || parsed.kind !== "epic") return null;
  return {
    spaceId: parsed.spaceId,
    epicId: decodeURIComponent(parsed.epicId),
  };
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

const CHIP =
  "h-7 w-fit gap-1 rounded-full border-0 px-2.5 text-xs font-medium text-white shadow-none [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-70";

const VALUE =
  "h-7 w-fit justify-end gap-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:opacity-60";

const STATUS_PILL: Record<Task["status"], string> = {
  [TaskStatus.TODO]: "bg-[#3c3228] text-[#f4e7d4]",
  [TaskStatus.IN_PROGRESS]: "bg-sky-900/80 text-sky-100",
  [TaskStatus.DONE]: "bg-emerald-900/70 text-emerald-100",
  [TaskStatus.CANCELLED]: "bg-zinc-800 text-zinc-300",
};

const PRIORITY_PILL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "bg-zinc-700 text-zinc-100",
  [TaskPriority.MEDIUM]: "bg-sky-900 text-sky-100",
  [TaskPriority.HIGH]: "bg-red-600 text-white",
  [TaskPriority.CRITICAL]: "bg-red-700 text-white",
};
