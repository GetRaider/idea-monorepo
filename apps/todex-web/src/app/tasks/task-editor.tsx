"use client";

import { useState } from "react";
import { Button, Input } from "@repo/ui";
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
    state: { selectedTask, tasks },
    actions: { setSelectedTaskId, updateTask, removeTask },
  } = useTasks();

  if (!selectedTask) return null;
  return (
    <TaskEditorForm
      key={selectedTask.id}
      task={selectedTask}
      tasks={tasks}
      onClose={() => setSelectedTaskId(null)}
      onSave={(body) => updateTask(selectedTask.id, body)}
      onRemove={() => removeTask(selectedTask.id)}
    />
  );
}

function TaskEditorForm({
  task,
  tasks,
  onClose,
  onSave,
  onRemove,
}: {
  task: Task;
  tasks: Task[];
  onClose: () => void;
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
    <aside className="h-screen w-80 shrink-0 overflow-auto border-l border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{task.taskKey}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="space-y-3">
        <Input
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <textarea
          className={fieldClass + " min-h-24 p-2"}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <select
          className={fieldClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as Task["status"])}
        >
          <option value={TaskStatus.TODO}>Todo</option>
          <option value={TaskStatus.IN_PROGRESS}>In progress</option>
          <option value={TaskStatus.DONE}>Done</option>
        </select>
        <select
          className={fieldClass}
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as Task["priority"])
          }
        >
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.CRITICAL}>Critical</option>
        </select>
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <Input
          placeholder="Estimate (1h, 30m, 2d)"
          value={estimationText}
          onChange={(event) => setEstimationText(event.target.value)}
        />
        {estimationInvalid ? (
          <p className="text-xs text-red-400">Use times like 1h, 30m, 2d</p>
        ) : null}
        <select
          className={fieldClass}
          value={parentTaskId}
          onChange={(event) => setParentTaskId(event.target.value)}
        >
          <option value="">No parent</option>
          {tasks
            .filter((item) => item.id !== task.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.taskKey} {item.summary}
              </option>
            ))}
        </select>
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
    </aside>
  );
}

const fieldClass =
  "h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground";
