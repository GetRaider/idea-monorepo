"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { Button, cn } from "@repo/ui";
import type { CalendarEventTemplate } from "@repo/api/todex";

import { CloseIcon, PlusIcon } from "@components/icons";

import { CalendarColorPicker } from "./calendar-color-picker";
import { DEFAULT_EVENT_COLOR } from "./calendar-colors";
import { useCalendar } from "./calendar-provider";

export function CalendarSchedulePanel() {
  const {
    state: { templates, tasks, boards },
    actions: { createTemplate, updateTemplate, removeTemplate, setScheduleOpen },
  } = useCalendar();
  const [tab, setTab] = useState<ScheduleTab>("events");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [color, setColor] = useState<string>(DEFAULT_EVENT_COLOR);
  const [composing, setComposing] = useState(false);
  const [spaceId, setSpaceId] = useState("");
  const needle = query.trim().toLowerCase();
  const activeSpaceId =
    spaceId || boards.find((board) => board.name === "Inbox")?.id || boards[0]?.id || "";
  const matchedTemplates = needle
    ? templates.filter((template) => template.title.toLowerCase().includes(needle))
    : templates;
  const matchedTasks = tasks.filter((task) => {
    if (task.spaceId !== activeSpaceId) return false;
    if (task.scheduleDate || task.status === "done" || task.status === "cancelled") {
      return false;
    }
    if (!needle) return true;
    return `${task.taskKey} ${task.summary}`.toLowerCase().includes(needle);
  });

  useEffect(() => {
    const root = document.querySelector("[data-calendar-schedule]");
    if (!(root instanceof HTMLElement)) return;
    const draggable = new Draggable(root, {
      itemSelector: "[data-template-id], [data-task-id]",
      eventData: (element) => {
        if (element.dataset.taskId) {
          return {
            title: element.dataset.title,
            duration: { minutes: Number(element.dataset.duration) || 30 },
            extendedProps: { taskId: element.dataset.taskId },
          };
        }
        return {
          title: element.dataset.title,
          duration: { minutes: Number(element.dataset.duration) || 30 },
          extendedProps: {
            templateId: element.dataset.templateId,
            color: element.dataset.color || null,
            description: element.dataset.description ?? "",
            taskScope: (element.dataset.taskScope ?? "")
              .split(",")
              .filter((id) => id.length > 0),
          },
        };
      },
    });
    return () => draggable.destroy();
  }, [tab, templates, tasks, needle]);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 flex-1 rounded-lg bg-surface p-0.5">
          <TabButton active={tab === "events"} onClick={() => setTab("events")}>
            Events
          </TabButton>
          <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")}>
            Tasks
          </TabButton>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          aria-label="Close schedule"
          onClick={() => setScheduleOpen(false)}
        >
          <CloseIcon size={14} />
        </Button>
      </div>
      <div className="flex items-center gap-2 px-3 pt-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === "events" ? "Search events" : "Search tasks"}
          aria-label={tab === "events" ? "Search events" : "Search tasks"}
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 text-sm"
        />
        {tab === "events" ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Add backlog template"
            onClick={() => setComposing(true)}
          >
            <PlusIcon size={14} />
          </Button>
        ) : null}
      </div>
      {tab === "tasks" ? (
        <div className="px-3 pt-3">
          <SpaceSelect
            boards={boards}
            value={activeSpaceId}
            onChange={setSpaceId}
          />
        </div>
      ) : null}
      <div
        data-calendar-schedule
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3"
      >
        {tab === "events" && composing ? (
          <form
            className="mb-2 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const durationMinutes = Number(minutes);
              if (!title.trim() || !Number.isFinite(durationMinutes)) return;
              void createTemplate({
                title: title.trim(),
                durationMinutes,
                color,
              }).then(() => {
                setTitle("");
                setMinutes("30");
                setColor(DEFAULT_EVENT_COLOR);
                setComposing(false);
              });
            }}
          >
            <div className="flex items-center gap-2">
              <CalendarColorPicker color={color} onChange={setColor} />
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Reusable event"
                className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                aria-label="Duration minutes"
                className="w-16 rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
              />
              <Button type="submit" size="sm" variant="ghost">
                Add
              </Button>
            </div>
          </form>
        ) : null}
        {tab === "events"
          ? matchedTemplates.map((template) => (
              <BacklogRow
                key={template.id}
                template={template}
                onSave={(body) => updateTemplate(template.id, body)}
                onDelete={() => removeTemplate(template.id)}
              />
            ))
          : matchedTasks.map((task) => (
              <div
                key={task.id}
                data-task-id={task.id}
                data-title={task.summary}
                data-duration={task.estimation ?? 30}
                className="cursor-grab rounded-lg border border-border px-2 py-1.5 text-sm active:cursor-grabbing"
              >
                <span className="block truncate">
                  <span className="text-muted-foreground">{task.taskKey}</span>{" "}
                  {task.summary}
                </span>
              </div>
            ))}
        {tab === "events" && matchedTemplates.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">No events in the backlog.</p>
        ) : null}
        {tab === "tasks" && matchedTasks.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">No unscheduled tasks.</p>
        ) : null}
      </div>
    </aside>
  );
}

function SpaceSelect({
  boards,
  value,
  onChange,
}: {
  boards: { id: string; name: string }[];
  value: string;
  onChange: (spaceId: string) => void;
}) {
  return (
    <select
      aria-label="Space"
      value={value}
      className="h-8 w-full rounded-md border border-border bg-transparent px-2 text-sm"
      onChange={(event) => onChange(event.target.value)}
    >
      {boards.map((board) => (
        <option key={board.id} value={board.id}>
          {board.name}
        </option>
      ))}
    </select>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex-1 rounded-md py-1 text-xs font-medium",
        active ? "bg-accent text-foreground" : "text-muted-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function BacklogRow({
  template,
  onSave,
  onDelete,
}: {
  template: CalendarEventTemplate;
  onSave: (body: {
    title: string;
    durationMinutes: number;
    color: string;
  }) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(template.title);
  const [minutes, setMinutes] = useState(String(template.durationMinutes));
  const [color, setColor] = useState(template.color ?? DEFAULT_EVENT_COLOR);

  return (
    <div
      data-template-id={template.id}
      data-title={template.title}
      data-duration={template.durationMinutes}
      data-color={template.color ?? ""}
      data-description={template.description}
      data-task-scope={template.taskScope.join(",")}
      className="rounded-lg border border-border px-2 py-1.5 text-sm"
    >
      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const durationMinutes = Number(minutes);
            if (!title.trim() || !Number.isFinite(durationMinutes)) return;
            void onSave({ title: title.trim(), durationMinutes, color }).then(() =>
              setEditing(false),
            );
          }}
        >
          <div className="flex items-center gap-2">
            <CalendarColorPicker color={color} onChange={setColor} />
            <input
              value={title}
              aria-label="Template title"
              onChange={(event) => setTitle(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              value={minutes}
              aria-label="Duration minutes"
              onChange={(event) => setMinutes(event.target.value)}
              className="w-16 rounded-md border border-border bg-transparent px-2 py-1 text-sm"
            />
            <Button type="submit" size="sm" variant="ghost">
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="group flex cursor-grab items-center gap-2 active:cursor-grabbing">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--swatch)]"
            style={{ "--swatch": template.color ?? DEFAULT_EVENT_COLOR } as CSSProperties}
          />
          <span className="min-w-0 flex-1 truncate">{template.title}</span>
          <button
            type="button"
            className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100"
            onClick={() => void onDelete()}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

type ScheduleTab = "events" | "tasks";
