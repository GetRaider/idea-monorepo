"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEstimation } from "@repo/api/todex";
import { Spinner } from "@repo/ui";
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

const PRIORITY_MARK = {
  low: "🔵",
  medium: "🟡",
  high: "🔴",
  critical: "🟣",
} as const;

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
      toast.error(error instanceof Error && error.message ? error.message : "Could not add the task to the queue"),
  });
  const [filters, setFilters] = useState<SuggestionFilters>(EMPTY_SUGGESTION_FILTERS);
  const tasks = suggestions.data ?? [];
  const boards = suggestionBoards(tasks);
  const areas = suggestionAreas(tasks, filters.boardId);
  const stages = suggestionStages(tasks);
  if (filters.areaName !== "all" && !areas.includes(filters.areaName)) {
    setFilters((current) => ({ ...current, areaName: "all" }));
  }
  const visible = applySuggestionFilters(tasks, filters, new Date());

  function update(patch: Partial<SuggestionFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">Suggestions to Execute</h2>
      </header>
      <div className="grid grid-cols-2 gap-2 border-b border-border px-3 py-3">
        <FilterSelect
          label="Sort"
          value={filters.sort}
          onChange={(sort) => update({ sort: sort as SuggestionFilters["sort"] })}
        >
          <option value="priority">Priority</option>
          <option value="board">Board</option>
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
          value={filters.boardId}
          onChange={(boardId) => update({ boardId })}
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
            value={filters.areaName}
            onChange={(areaName) => update({ areaName })}
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
            update({ estimation: estimation as SuggestionFilters["estimation"] })
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
      {suggestions.isLoading ? (
        <Spinner className="flex-1" />
      ) : suggestions.isError ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Could not load suggestions.
        </p>
      ) : visible.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No tasks match these filters.
        </p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-auto">
          {visible.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-2 border-b border-border px-3 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-baseline gap-1.5 text-sm">
                  <span aria-hidden className="shrink-0 text-xs leading-none">
                    {PRIORITY_MARK[task.priority]}
                  </span>
                  <span className="truncate">{task.summary}</span>
                  <span className="shrink-0 text-muted-foreground">
                    ({formatEstimation(task.estimation)})
                  </span>
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {task.boardName}
                  {task.isDefaultArea ? "" : ` (${task.areaName})`}
                  {task.stageName ? ` · ${task.stageName}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled={enqueue.isPending}
                onClick={() => enqueue.mutate(task.id)}
              >
                Add
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
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
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
      {label}
      <select
        aria-label={label}
        value={value}
        className="h-8 rounded-md border border-border bg-transparent px-1.5 text-xs text-foreground outline-none"
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
