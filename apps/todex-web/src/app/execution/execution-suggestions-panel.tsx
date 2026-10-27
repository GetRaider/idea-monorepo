"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEstimation } from "@repo/api/todex";
import { Spinner, cn } from "@repo/ui";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

import {
  EMPTY_SUGGESTION_FILTERS,
  applySuggestionFilters,
  suggestionAreas,
  suggestionBoards,
  suggestionStages,
  type SuggestionFilters,
} from "./execution-suggestions";

export function ExecutionSuggestionsPanel() {
  const queryClient = useQueryClient();
  const suggestions = useQuery({
    queryKey: ["execution", "suggestions"],
    queryFn: () => todexClient.execution.suggestions(),
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
  const visible = applySuggestionFilters(tasks, filters, new Date());

  function update(patch: Partial<SuggestionFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]">
      <header className="flex items-center justify-between px-4 pt-3">
        <h2 className="text-sm font-semibold text-[#f2f2f0]">Suggestions</h2>
        <button
          type="button"
          className="rounded-md px-2 py-1.5 text-sm text-[#a3a3a0] hover:bg-surface hover:text-[#f2f2f0]"
          onClick={() => setFilters(EMPTY_SUGGESTION_FILTERS)}
        >
          Reset
        </button>
      </header>
      <div className="flex flex-wrap gap-2 px-4">
        <FilterSelect
          label="Sort"
          value={filters.sort}
          onChange={(sort) =>
            update({ sort: sort as SuggestionFilters["sort"] })
          }
        >
          <option value="priority">Priority</option>
          <option value="board">Space</option>
          <option value="estimation">Estimation</option>
          <option value="schedule">Schedule</option>
          <option value="due">Due</option>
          <option value="stage">Stage</option>
        </FilterSelect>
        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(priority) =>
            update({ priority: priority as SuggestionFilters["priority"] })
          }
        >
          <option value="all">Any</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </FilterSelect>
        <FilterSelect
          label="Board"
          value={filters.spaceId}
          onChange={(spaceId) => update({ spaceId })}
        >
          <option value="all">Any</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </FilterSelect>
        {areas.length > 0 ? (
          <FilterSelect
            label="Area"
            value={filters.sectionName}
            onChange={(sectionName) => update({ sectionName })}
          >
            <option value="all">Any</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </FilterSelect>
        ) : null}
        <FilterSelect
          label="Estimation"
          value={filters.estimation}
          onChange={(estimation) =>
            update({
              estimation: estimation as SuggestionFilters["estimation"],
            })
          }
        >
          <option value="all">Any</option>
          <option value="short">≤ 30m</option>
          <option value="medium">31m–2h</option>
          <option value="long">&gt; 2h</option>
        </FilterSelect>
        <FilterSelect
          label="Schedule"
          value={filters.schedule}
          onChange={(schedule) =>
            update({ schedule: schedule as SuggestionFilters["schedule"] })
          }
        >
          <option value="all">Any</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="later">Later</option>
          <option value="unscheduled">Unscheduled</option>
        </FilterSelect>
        <FilterSelect
          label="Due"
          value={filters.due}
          onChange={(due) => update({ due: due as SuggestionFilters["due"] })}
        >
          <option value="all">Any</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="none">No due date</option>
        </FilterSelect>
        {stages.length > 0 ? (
          <FilterSelect
            label="Stage"
            value={filters.stage}
            onChange={(stage) => update({ stage })}
          >
            <option value="all">Any</option>
            <option value="none">No stage</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </FilterSelect>
        ) : null}
      </div>
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
                <p className="truncate text-sm font-medium text-[#f2f2f0]">
                  {task.summary}
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

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const solid = label === "Sort";

  return (
    <label
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md pl-2.5 pr-1.5 text-sm",
        solid
          ? "primary-noise bg-[#f2f2f0] text-[#3a3a38]"
          : "border border-white/[0.09] bg-white/[0.04] text-[#8f8f8c]",
      )}
    >
      <span>{solid ? "Sort." : label}</span>
      <select
        aria-label={label}
        value={value}
        className={cn(
          "max-w-28 appearance-none bg-transparent pr-4 font-medium outline-none",
          solid ? "text-[#0b0b0b]" : "text-[#e6e6e3]",
        )}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronIcon className={solid ? "text-[#0b0b0b]" : "text-[#e6e6e3]"} />
    </label>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={cn("pointer-events-none -ml-4 size-3.5", className)}
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
