"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEstimation, TaskStatus } from "@repo/api/todex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  cn,
} from "@repo/ui";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";
import { PriorityGlyph, StatusGlyph } from "../planning/task-board.ui";

import {
  EMPTY_SUGGESTION_FILTERS,
  applySuggestionFilters,
  suggestionAreas,
  suggestionBoards,
  suggestionStages,
  type SuggestionFilters,
} from "./execution-suggestions";

export function ExecutionSuggestionsPanel({
  showDone,
  onShowDoneChange,
}: {
  showDone: boolean;
  onShowDoneChange: (show: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const suggestions = useQuery({
    queryKey: ["execution", "suggestions", showDone],
    queryFn: () => todexClient.execution.suggestions(showDone),
  });
  const enqueue = useMutation({
    mutationFn: (taskId: string) => todexClient.execution.enqueue({ taskId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["execution"] }),
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Could not add the task to the queue",
      ),
  });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<SuggestionFilters>(
    EMPTY_SUGGESTION_FILTERS,
  );
  const tasks = suggestions.data ?? [];
  const boards = suggestionBoards(tasks);
  const areas = suggestionAreas(tasks, filters.spaceId);
  const stages = suggestionStages(tasks);
  if (filters.sectionName !== "all" && !areas.includes(filters.sectionName)) {
    setFilters((current) => ({ ...current, sectionName: "all" }));
  }
  const visible = applySuggestionFilters(
    showDone ? tasks : tasks.filter((task) => task.status !== TaskStatus.DONE),
    filters,
    new Date(),
  );

  function update(patch: Partial<SuggestionFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]">
      <header className="flex items-center justify-between px-4 pt-3">
        <h2 className="text-sm font-semibold text-[#f2f2f0]">Suggestions</h2>
        <button
          type="button"
          aria-expanded={filtersOpen}
          className="flex h-7 items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-[#cfcfcc] hover:bg-white/[0.08]"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {filtersOpen ? "Hide" : "Show"}
          <HeaderChevron open={filtersOpen} />
        </button>
      </header>
      {filtersOpen ? (
        <div className="grid grid-cols-2 items-center gap-2 px-4 pb-1">
          <FilterSelect
            label="Sort"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(sort) =>
              update({ sort: sort as SuggestionFilters["sort"] })
            }
          />
          <FilterSelect
            label="Priority"
            value={filters.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) =>
              update({ priority: priority as SuggestionFilters["priority"] })
            }
          />
          <FilterSelect
            label="Space"
            value={filters.spaceId}
            options={[
              { value: "all", label: "Any" },
              ...boards.map((board) => ({
                value: board.id,
                label: board.name,
              })),
            ]}
            onChange={(spaceId) => update({ spaceId })}
          />
          {areas.length > 0 ? (
            <FilterSelect
              label="Area"
              value={filters.sectionName}
              options={[
                { value: "all", label: "Any" },
                ...areas.map((area) => ({ value: area, label: area })),
              ]}
              onChange={(sectionName) => update({ sectionName })}
            />
          ) : null}
          <FilterSelect
            label="Estimation"
            value={filters.estimation}
            options={ESTIMATION_OPTIONS}
            onChange={(estimation) =>
              update({
                estimation: estimation as SuggestionFilters["estimation"],
              })
            }
          />
          <FilterSelect
            label="Schedule"
            value={filters.schedule}
            options={SCHEDULE_OPTIONS}
            onChange={(schedule) =>
              update({ schedule: schedule as SuggestionFilters["schedule"] })
            }
          />
          <FilterSelect
            label="Due"
            value={filters.due}
            options={DUE_OPTIONS}
            onChange={(due) => update({ due: due as SuggestionFilters["due"] })}
          />
          {stages.length > 0 ? (
            <FilterSelect
              label="Stage"
              value={filters.stage}
              options={[
                { value: "all", label: "Any" },
                { value: "none", label: "No stage" },
                ...stages.map((stage) => ({ value: stage, label: stage })),
              ]}
              onChange={(stage) => update({ stage })}
            />
          ) : null}
          <label className="col-span-2 flex cursor-pointer items-center gap-2 py-1 text-xs text-[#cfcfcc]">
            <input type="checkbox" checked={showDone} onChange={(event) => onShowDoneChange(event.target.checked)} className="size-4 accent-white" />
            Show completed tasks
          </label>
          <button
            type="button"
            className="h-7 justify-self-start px-1 text-xs text-[#8f8f8c] hover:text-[#f2f2f0]"
            onClick={() => {
              setFilters(EMPTY_SUGGESTION_FILTERS);
              onShowDoneChange(false);
            }}
          >
            Reset
          </button>
        </div>
      ) : null}
      <div className="h-px w-full bg-white/[0.06]" />
      {suggestions.isLoading ? (
        <Spinner className="flex-1" />
      ) : suggestions.isError ? (
        <p className="px-4 py-6 text-sm text-[#8f8f8c]">
          Could not load suggestions.
        </p>
      ) : visible.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[#8f8f8c]">
          No tasks match these filters.
        </p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-auto px-2">
          {visible.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium text-[#f2f2f0]">
                  <StatusGlyph status={task.status} />
                  <PriorityGlyph priority={task.priority} />
                  <span className="truncate">{task.summary}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-[#8f8f8c]">
                  {task.spaceName}
                  {task.isDefaultSection ? "" : ` · ${task.sectionName}`}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-[#cfcfcc]">
                {formatEstimation(task.estimation) || "—"}
              </span>
              <button
                type="button"
                aria-label={`Add ${task.summary} to the queue`}
                className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-[#e6e6e3] hover:bg-white/10 disabled:opacity-40"
                disabled={enqueue.isPending}
                onClick={() => enqueue.mutate(task.id)}
              >
                <PlusIcon />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden>
      <path
        d="M9 3.5v11M3.5 9h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeaderChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={cn("size-3.5", open && "rotate-180")}
      aria-hidden
    >
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="h-8 w-full min-w-0 gap-2 rounded-md border-white/10 bg-white/[0.04] px-2.5 text-xs text-[#e6e6e3] shadow-none focus:ring-0 [&>svg]:size-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="shrink-0 text-[#8f8f8c]">{label}</span>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-xs"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "board", label: "Space" },
  { value: "estimation", label: "Estimation" },
  { value: "schedule", label: "Schedule" },
  { value: "due", label: "Due" },
  { value: "stage", label: "Stage" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

const ESTIMATION_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "short", label: "≤ 30m" },
  { value: "medium", label: "31m–2h" },
  { value: "long", label: "> 2h" },
] as const;

const SCHEDULE_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "later", label: "Later" },
  { value: "unscheduled", label: "Unscheduled" },
] as const;

const DUE_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "none", label: "No due date" },
] as const;
