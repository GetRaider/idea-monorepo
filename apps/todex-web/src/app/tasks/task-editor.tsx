"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  ConfirmDialog,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui";
import {
  formatEstimation,
  parseEstimation,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type { Task, UpdateTaskBody } from "@repo/api/todex";

import {
  dateInputToLocalDayStartIso,
  isoToDateInput,
} from "./task-helpers";
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
    actions: { setSelectedTaskId, updateTask, removeTask },
  } = useTasks();

  return (
    <Sheet
      open={selectedTaskId !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedTaskId(null);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {selectedTask ? (
          <TaskEditorForm
            key={selectedTask.id}
            task={selectedTask}
            tasks={tasks}
            onSave={(body) => updateTask(selectedTask.id, body)}
            onRemove={() => removeTask(selectedTask.id)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskEditorForm({
  task,
  tasks,
  onSave,
  onRemove,
}: {
  task: Task;
  tasks: Task[];
  onSave: (body: UpdateTaskBody) => void;
  onRemove: () => void;
}) {
  const [summary, setSummary] = useState(task.summary);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [scheduleDate, setScheduleDate] = useState(
    isoToDateInput(task.scheduleDate),
  );
  const [dueDate, setDueDate] = useState(isoToDateInput(task.dueDate));
  const [estimationText, setEstimationText] = useState(
    formatEstimation(task.estimation),
  );
  const [parentTaskId, setParentTaskId] = useState(task.parentTaskId ?? "");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const parsedEstimation = parseEstimation(estimationText);
  const estimationInvalid =
    estimationText.trim() !== "" && parsedEstimation === null;

  return (
    <>
      <SheetHeader className="mb-4 space-y-1 text-left">
        <SheetTitle className="font-mono text-xs font-normal text-muted-foreground">
          {task.taskKey}
        </SheetTitle>
      </SheetHeader>
      <div className="space-y-4">
        <Field label="Summary">
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </Field>
        <Field label="Description">
          <TaskDescriptionEditor
            content={description}
            onChange={setDescription}
          />
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as Task["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>
                In progress
              </SelectItem>
              <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as Task["priority"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
              <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
              <SelectItem value={TaskPriority.CRITICAL}>Critical</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Schedule" hint="When you plan to do it">
          <Input
            type="date"
            value={scheduleDate}
            onChange={(event) => setScheduleDate(event.target.value)}
          />
        </Field>
        <Field label="Due" hint="Last day it should be done">
          <Input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Field>
        <Field label="Estimate">
          <Input
            placeholder="1h, 30m, 2d"
            value={estimationText}
            onChange={(event) => setEstimationText(event.target.value)}
          />
          {estimationInvalid ? (
            <p className="text-xs text-destructive">
              Use times like 1h, 30m, 2d
            </p>
          ) : null}
        </Field>
        <Field label="Parent task">
          <Select
            value={parentTaskId || "none"}
            onValueChange={(value) =>
              setParentTaskId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger>
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
        </Field>
        <Button
          className="w-full"
          disabled={estimationInvalid}
          onClick={() => {
            if (estimationInvalid) return;
            onSave({
              summary,
              description,
              status,
              priority,
              scheduleDate: dateInputToLocalDayStartIso(scheduleDate),
              dueDate: dateInputToLocalDayStartIso(dueDate),
              estimation: estimationText.trim() ? parsedEstimation : null,
              parentTaskId: parentTaskId || null,
            });
          }}
        >
          Save
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setIsDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>
      {isDeleteOpen ? (
        <ConfirmDialog
          title="Delete task"
          description={`Delete "${task.summary}"?`}
          confirmLabel="Delete"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={onRemove}
        />
      ) : null}
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
