"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Draggable } from "@fullcalendar/interaction";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@repo/ui";
import type { CalendarEventTemplate } from "@repo/api/todex";

import { ChevronIcon, PlusIcon } from "@components/icons";
import { useModuleSidebar } from "@components/module-sidebar";
import { ResizeHandle } from "@components/resize-handle";
import {
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
  parseStoredPanelWidth,
} from "@/helpers/panel-layout";

import { CalendarColorPicker } from "./calendar-color-picker";
import { DEFAULT_EVENT_COLOR } from "./calendar-colors";
import { useCalendar } from "./calendar-provider";

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function CalendarSidebar() {
  const {
    state: { templates, tasks, visibility },
    actions: {
      createTemplate,
      updateTemplate,
      removeTemplate,
      setVisibility,
      focusDay,
    },
  } = useCalendar();
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [color, setColor] = useState<string>(DEFAULT_EVENT_COLOR);
  const [composing, setComposing] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");
  const [pickerMonth, setPickerMonth] = useState(() => monthStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const { open: isOpen } = useModuleSidebar();
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);
  const rows = useMemo(() => monthGrid(pickerMonth), [pickerMonth]);
  const taskNeedle = taskQuery.trim().toLowerCase();
  const matchedTasks = taskNeedle
    ? tasks
        .filter(
          (task) =>
            !task.scheduleDate &&
            task.status !== "done" &&
            task.status !== "cancelled" &&
            `${task.taskKey} ${task.summary}`.toLowerCase().includes(taskNeedle),
        )
        .slice(0, 20)
    : [];

  useEffect(() => {
    setWidth(readWidth());
  }, []);

  useEffect(() => {
    const backlog = document.querySelector("[data-calendar-backlog]");
    const taskList = document.querySelector("[data-calendar-tasks]");
    const draggables: Draggable[] = [];
    if (backlog instanceof HTMLElement) {
      draggables.push(
        new Draggable(backlog, {
          itemSelector: "[data-template-id]",
          eventData: (element) => ({
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
          }),
        }),
      );
    }
    if (taskList instanceof HTMLElement) {
      draggables.push(
        new Draggable(taskList, {
          itemSelector: "[data-task-id]",
          eventData: (element) => ({
            title: element.dataset.title,
            duration: { minutes: Number(element.dataset.duration) || 30 },
            extendedProps: { taskId: element.dataset.taskId },
          }),
        }),
      );
    }
    return () => {
      for (const draggable of draggables) draggable.destroy();
    };
  }, [templates, taskQuery, tasks, isOpen]);

  if (!isOpen) return null;

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col"
      style={{ width }}
    >
      <ResizeHandle
        label="Resize sidebar"
        edge="trailing"
        width={width}
        min={TASKS_SIDEBAR_MIN_WIDTH}
        max={TASKS_SIDEBAR_MAX_WIDTH}
        onWidth={setWidth}
        onCommit={writeWidth}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 pt-3">
      <SidebarSection
        title="Month"
        defaultOpen
        actions={
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              aria-label="Previous month"
              onClick={() =>
                setPickerMonth(
                  (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
            >
              <ChevronIcon size={14} className="rotate-180" />
            </Button>
            <span className="w-8 text-center text-xs text-foreground">
              {pickerMonth.toLocaleDateString(undefined, { month: "short" })}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              aria-label="Next month"
              onClick={() =>
                setPickerMonth(
                  (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1),
                )
              }
            >
              <ChevronIcon size={14} />
            </Button>
          </div>
        }
      >
        <div className="px-2 pb-3">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="grid grid-cols-7 px-1 pt-1">
              {WEEK_LETTERS.map((letter, index) => (
                <div
                  key={`${letter}-${index}`}
                  className="flex h-6 items-center justify-center text-[10px] font-medium text-muted-foreground"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 px-1 pb-1">
              {rows.flatMap((week) =>
                week.map(({ date, inMonth }) => {
                  const selected = sameDay(date, selectedDay);
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      className={cn(
                        "flex h-7 items-center justify-center rounded-md text-[11px] tabular-nums",
                        inMonth ? "text-foreground" : "text-muted-foreground/40",
                        selected && "bg-foreground text-background",
                        !selected && inMonth && "hover:bg-accent",
                      )}
                      onClick={() => {
                        const day = startOfDay(date);
                        setSelectedDay(day);
                        setPickerMonth(monthStart(day));
                        focusDay(day);
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Event Types">
        <ul className="flex flex-col gap-1 px-2 pb-3">
          <CalendarToggle
            id="kind-events"
            label="Events"
            checked={visibility.events}
            onCheckedChange={(checked) => setVisibility({ events: checked })}
          />
          <CalendarToggle
            id="kind-tasks"
            label="Tasks"
            checked={visibility.tasks}
            onCheckedChange={(checked) => setVisibility({ tasks: checked })}
          />
        </ul>
      </SidebarSection>

      <SidebarSection
        title="Events Backlog"
        actions={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground"
            aria-label="Add backlog template"
            onClick={() => setComposing(true)}
          >
            <PlusIcon size={14} />
          </Button>
        }
      >
        {composing ? (
          <form
            className="flex flex-col gap-2 px-2 pb-2"
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
        <div
          data-calendar-backlog
          className="flex flex-col gap-1 px-2 pb-3"
        >
          {templates.map((template) => (
            <BacklogRow
              key={template.id}
              template={template}
              onSave={(body) => updateTemplate(template.id, body)}
              onDelete={() => removeTemplate(template.id)}
            />
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Tasks">
        <div className="flex flex-col gap-2 px-2 pb-3">
          <input
            value={taskQuery}
            onChange={(event) => setTaskQuery(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="h-8 rounded-md border border-border bg-transparent px-2 text-sm"
          />
          <ul data-calendar-tasks className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {matchedTasks.map((task) => (
              <li
                key={task.id}
                data-task-id={task.id}
                data-title={task.summary}
                data-duration={task.estimation ?? 30}
                className="cursor-grab rounded-lg border border-border px-2 py-1.5 text-sm active:cursor-grabbing"
              >
                <span className="block truncate">
                  <span className="text-muted-foreground">{task.taskKey}</span> {task.summary}
                </span>
              </li>
            ))}
          </ul>
          {taskNeedle ? null : (
            <p className="text-xs text-muted-foreground">
              Search an unscheduled task, then drag it onto the calendar.
            </p>
          )}
          {taskNeedle && matchedTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No matching tasks.</p>
          ) : null}
        </div>
      </SidebarSection>
      </div>
    </aside>
  );
}

function BacklogRow({
  template,
  onSave,
  onDelete,
}: {
  template: CalendarEventTemplate;
  onSave: (body: { title: string; durationMinutes: number; color: string }) => Promise<unknown>;
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
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
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

function SidebarSection({
  title,
  defaultOpen = false,
  actions,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="mb-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <CollapsibleTrigger className="group flex min-w-0 items-center gap-1 text-left text-sm text-muted-foreground">
          <ChevronIcon
            size={14}
            className="shrink-0 transition-transform group-data-[state=open]:rotate-90"
          />
          <span className="truncate">{title}</span>
        </CollapsibleTrigger>
        {actions}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CalendarToggle({
  id,
  label,
  checked,
  dotClassName,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  dotClassName?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md px-1 py-0.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label htmlFor={id} className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        {dotClassName ? (
          <span className={cn("h-2 w-2 shrink-0 rounded-sm", dotClassName)} />
        ) : null}
        <span className="truncate">{label}</span>
      </label>
    </li>
  );
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function mondayBefore(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  next.setHours(0, 0, 0, 0);
  return next;
}

function monthGrid(visibleMonth: Date) {
  const month = visibleMonth.getMonth();
  const cursor = mondayBefore(new Date(visibleMonth.getFullYear(), month, 1));
  const rows: { date: Date; inMonth: boolean }[][] = [];
  for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
    const week: { date: Date; inMonth: boolean }[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      week.push({
        date: new Date(cursor),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(week);
  }
  return rows;
}

const WIDTH_STORAGE_KEY = "todex:calendar-sidebar-width";

function readWidth() {
  try {
    return parseStoredPanelWidth(
      localStorage.getItem(WIDTH_STORAGE_KEY),
      TASKS_SIDEBAR_DEFAULT_WIDTH,
      TASKS_SIDEBAR_MIN_WIDTH,
      TASKS_SIDEBAR_MAX_WIDTH,
    );
  } catch {
    return TASKS_SIDEBAR_DEFAULT_WIDTH;
  }
}

function writeWidth(next: number) {
  try {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(next));
  } catch {
    /* private mode */
  }
}
