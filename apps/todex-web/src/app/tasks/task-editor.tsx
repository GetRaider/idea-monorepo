"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import { TaskStatus } from "@repo/api/todex";
import type { Task, UpdateTaskBody } from "@repo/api/todex";

import {
  CollapseIcon,
  ExpandIcon,
  ListIcon,
  TrashIcon,
} from "@components/icons";

import {
  DateChip,
  EstimationChip,
  PriorityChip,
  StatusChip,
} from "./task-chips";
import {
  useTaskEditorChrome,
  type TaskEditorChrome,
} from "./task-editor-chrome";
import { subtaskCompletion } from "./task-helpers";
import { useTasks } from "./tasks-provider";

const TaskDescriptionEditor = dynamic(
  () =>
    import("./task-description-editor").then(
      (module) => module.TaskDescriptionEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
);

export function TaskEditor() {
  const {
    state: { selectedTask, tasks, selectedTaskId },
    actions: { setSelectedTaskId, updateTask, removeTask, createTask },
  } = useTasks();
  const { chrome, setChrome } = useTaskEditorChrome();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setIsDeleteOpen(false);
  }, [selectedTaskId]);

  if (selectedTaskId === null) return null;

  const headerActions = (
    <TaskEditorHeaderActions
      chrome={chrome}
      onChromeChange={setChrome}
      onDelete={() => setIsDeleteOpen(true)}
    />
  );

  const form = selectedTask ? (
    <TaskEditorForm
      key={selectedTask.id}
      chrome={chrome}
      task={selectedTask}
      tasks={tasks}
      onSaveSummary={(body) => updateTask(selectedTask.id, body)}
      onPatch={(body) =>
        updateTask(selectedTask.id, body, { optimistic: true })
      }
      onPatchTask={(taskId, body) =>
        updateTask(taskId, body, { optimistic: true })
      }
      onOpenTask={setSelectedTaskId}
      onCreateSubtask={(summary) =>
        createTask({ summary, parentTaskId: selectedTask.id })
      }
    />
  ) : null;

  const confirmDelete =
    selectedTask && isDeleteOpen ? (
      <ConfirmDialog
        title="Delete task"
        description={`Delete "${selectedTask.summary}"?`}
        confirmLabel="Delete"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => removeTask(selectedTask.id)}
      />
    ) : null;

  if (chrome === "dock") {
    return (
      <>
        <aside className="flex h-screen w-[28rem] shrink-0 flex-col overflow-hidden border-l border-border bg-panel">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p className="font-mono text-sm font-semibold">
              {selectedTask?.taskKey ?? "Task"}
            </p>
            <div className="flex items-center gap-1">
              {headerActions}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Close"
                onClick={() => setSelectedTaskId(null)}
              >
                ×
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{form}</div>
        </aside>
        {confirmDelete}
      </>
    );
  }

  return (
    <>
      <Dialog
        title={selectedTask?.taskKey ?? "Task"}
        onClose={() => setSelectedTaskId(null)}
        headerActions={headerActions}
        maxWidth={960}
        className="min-h-[70vh]"
      >
        {form}
      </Dialog>
      {confirmDelete}
    </>
  );
}

function TaskEditorHeaderActions({
  chrome,
  onChromeChange,
  onDelete,
}: {
  chrome: TaskEditorChrome;
  onChromeChange: (chrome: TaskEditorChrome) => void;
  onDelete: () => void;
}) {
  const isFullscreen = chrome === "overlay";
  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
        onClick={() => onChromeChange(isFullscreen ? "dock" : "overlay")}
      >
        {isFullscreen ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        aria-label="Delete task"
        onClick={onDelete}
      >
        <TrashIcon size={16} />
      </Button>
    </>
  );
}

function TaskEditorForm({
  chrome,
  task,
  tasks,
  onSaveSummary,
  onPatch,
  onPatchTask,
  onOpenTask,
  onCreateSubtask,
}: {
  chrome: TaskEditorChrome;
  task: Task;
  tasks: Task[];
  onSaveSummary: (body: UpdateTaskBody) => void;
  onPatch: (body: UpdateTaskBody) => void;
  onPatchTask: (taskId: string, body: UpdateTaskBody) => void;
  onOpenTask: (taskId: string) => void;
  onCreateSubtask: (summary: string) => void;
}) {
  const [summary, setSummary] = useState(task.summary);
  const [description, setDescription] = useState(task.description);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskSummary, setSubtaskSummary] = useState("");
  const childTasks = tasks.filter((item) => item.parentTaskId === task.id);
  const isDock = chrome === "dock";

  const submitSubtask = () => {
    if (!subtaskSummary.trim()) return;
    onCreateSubtask(subtaskSummary.trim());
    setSubtaskSummary("");
    setIsAddingSubtask(false);
  };

  return (
    <div
      className={cn(
        "grid min-h-0 flex-1 gap-6",
        isDock ? "grid-cols-1" : "md:grid-cols-[minmax(0,1fr)_16rem]",
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        <Input
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="h-auto border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
          aria-label="Summary"
        />
        <TaskDescriptionEditor
          content={description}
          onChange={setDescription}
        />
        <SubtaskSection
          childTasks={childTasks}
          isAdding={isAddingSubtask}
          subtaskSummary={subtaskSummary}
          onSubtaskSummaryChange={setSubtaskSummary}
          onStartAdd={() => setIsAddingSubtask(true)}
          onSubmit={submitSubtask}
          onCancelAdd={() => {
            setSubtaskSummary("");
            setIsAddingSubtask(false);
          }}
          onOpenTask={onOpenTask}
          onToggleDone={(child) =>
            onPatchTask(child.id, {
              status:
                child.status === TaskStatus.DONE
                  ? TaskStatus.TODO
                  : TaskStatus.DONE,
            })
          }
        />
        <div className="mt-auto flex justify-end pt-4">
          <Button onClick={() => onSaveSummary({ summary, description })}>
            Save
          </Button>
        </div>
      </div>
      <aside
        className={cn(
          "space-y-1 border-t border-border pt-4",
          !isDock && "md:border-l md:border-t-0 md:pl-4 md:pt-0",
        )}
      >
        <PropertyRow label="Status">
          <StatusChip
            status={task.status}
            onChange={(status) => onPatch({ status })}
          />
        </PropertyRow>
        <PropertyRow label="Priority">
          <PriorityChip
            priority={task.priority}
            onChange={(priority) => onPatch({ priority })}
          />
        </PropertyRow>
        <PropertyRow label="Schedule">
          <DateChip
            value={task.scheduleDate}
            emptyLabel="Schedule"
            onChange={(scheduleDate) => onPatch({ scheduleDate })}
          />
        </PropertyRow>
        <PropertyRow label="Due">
          <DateChip
            value={task.dueDate}
            emptyLabel="Due"
            onChange={(dueDate) => onPatch({ dueDate })}
          />
        </PropertyRow>
        <PropertyRow label="Estimate">
          <EstimationChip
            value={task.estimation}
            onChange={(estimation) => onPatch({ estimation })}
          />
        </PropertyRow>
        <PropertyRow label="Parent">
          <Select
            value={task.parentTaskId ?? "none"}
            onValueChange={(value) =>
              onPatch({ parentTaskId: value === "none" ? null : value })
            }
          >
            <SelectTrigger className="h-8 border-0 bg-transparent px-0 shadow-none">
              <SelectValue placeholder="No parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No parent</SelectItem>
              {tasks
                .filter((item) => item.id !== task.id)
                .map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.taskKey} {item.summary}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </PropertyRow>
      </aside>
    </div>
  );
}

function SubtaskSection({
  childTasks,
  isAdding,
  subtaskSummary,
  onSubtaskSummaryChange,
  onStartAdd,
  onSubmit,
  onCancelAdd,
  onOpenTask,
  onToggleDone,
}: {
  childTasks: Task[];
  isAdding: boolean;
  subtaskSummary: string;
  onSubtaskSummaryChange: (value: string) => void;
  onStartAdd: () => void;
  onSubmit: () => void;
  onCancelAdd: () => void;
  onOpenTask: (taskId: string) => void;
  onToggleDone: (child: Task) => void;
}) {
  const { done, total } = subtaskCompletion(childTasks);
  const percent = total === 0 ? 0 : (done / total) * 100;

  return (
    <section className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ListIcon size={16} className="text-muted-foreground" />
          Sub Task
        </div>
        <span className="text-xs text-muted-foreground">
          {done}/{total}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${percent}%` }}
        />
      </div>
      {childTasks.length > 0 ? (
        <ul className="space-y-1">
          {childTasks.map((child) => {
            const isDone = child.status === TaskStatus.DONE;
            return (
              <li key={child.id} className="flex items-center gap-2 px-1 py-1">
                <Checkbox
                  checked={isDone}
                  aria-label={`Mark ${child.summary} ${isDone ? "to do" : "done"}`}
                  onCheckedChange={() => onToggleDone(child)}
                />
                <button
                  type="button"
                  className={cn(
                    "min-w-0 flex-1 truncate text-left text-sm hover:underline",
                    isDone && "text-muted-foreground line-through",
                  )}
                  onClick={() => onOpenTask(child.id)}
                >
                  {child.summary}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {isAdding ? (
        <Input
          autoFocus
          className="mt-2"
          value={subtaskSummary}
          placeholder="Subtask title"
          onChange={(event) => onSubtaskSummaryChange(event.target.value)}
          onBlur={() => {
            if (subtaskSummary.trim()) onSubmit();
            else onCancelAdd();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancelAdd();
            }
          }}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          onClick={onStartAdd}
        >
          + Add new Subtask
        </Button>
      )}
    </section>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
