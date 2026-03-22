"use client";

import {
  SelectableListTitle,
  TaskSelectionHeader,
  SelectAllRow,
  TaskSelectionSection,
  TaskCheckbox,
  TaskLabel,
} from "@/components/SelectableList";
import { Task } from "@/components/Boards/KanbanBoard/types";

import { LoadingContainer, Spinner, LoadingState } from "./SelectList.ui";

export function SelectList({
  tasks,
  isLoading,
  selectedIds,
  onSelectionChange,
  title = "Select tasks to explore",
  loadingLabel = "Loading tasks...",
}: SelectListProps) {
  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length;

  const toggleTask = (taskId: string) => {
    const next = new Set(selectedIds);
    next.has(taskId) ? next.delete(taskId) : next.add(taskId);
    onSelectionChange(next);
  };

  const toggleAll = () =>
    onSelectionChange(
      allSelected ? new Set() : new Set(tasks.map((t) => t.id)),
    );

  return (
    <>
      <TaskSelectionHeader>
        <SelectableListTitle>{title}</SelectableListTitle>
        {!isLoading && tasks.length > 0 && (
          <SelectAllRow type="button" onClick={toggleAll}>
            {allSelected ? "Deselect all" : "Select all"}
          </SelectAllRow>
        )}
      </TaskSelectionHeader>
      <TaskSelectionSection>
        {isLoading ? (
          <LoadingContainer>
            <Spinner />
            <LoadingState>{loadingLabel}</LoadingState>
          </LoadingContainer>
        ) : (
          tasks.map((task) => (
            <TaskLabel key={task.id}>
              <TaskCheckbox
                type="checkbox"
                checked={selectedIds.has(task.id)}
                onChange={() => toggleTask(task.id)}
              />
              <span>{task.summary}</span>
            </TaskLabel>
          ))
        )}
      </TaskSelectionSection>
    </>
  );
}

type SelectListProps = {
  tasks: Task[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  title?: string;
  loadingLabel?: string;
};
