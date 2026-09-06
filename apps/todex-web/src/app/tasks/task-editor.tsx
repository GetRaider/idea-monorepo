"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
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
  Textarea,
} from "@repo/ui";
import {
  formatEstimation,
  parseEstimation,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { useTasks } from "./tasks-provider";

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
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
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
  onSave: (body: {
    summary: string;
    description: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate: string | null;
    estimation: number | null;
    parentTaskId: string | null;
  }) => void;
  onRemove: () => void;
}) {
  const [summary, setSummary] = useState(task.summary);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) ?? "");
  const [estimationText, setEstimationText] = useState(
    formatEstimation(task.estimation),
  );
  const [parentTaskId, setParentTaskId] = useState(task.parentTaskId ?? "");
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
          <Textarea
            className="min-h-24"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
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
        <Field label="Due date">
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
              dueDate: dueDate ? new Date(dueDate).toISOString() : null,
              estimation: estimationText.trim() ? parsedEstimation : null,
              parentTaskId: parentTaskId || null,
            });
          }}
        >
          Save
        </Button>
        <Button className="w-full" variant="outline" onClick={onRemove}>
          Delete
        </Button>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
