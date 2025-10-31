"use client";

import React, { useState } from "react";

import { TaskStatus } from "../KanbanBoard";
import {
  Column as ColumnStyles,
  ColumnHeader,
  ColumnTitle,
  StatusIcon,
  Count,
  ColumnContent,
  EmptyColumnTopIndicator,
  EmptyColumnPlaceholder,
  DropIndicator,
  DropIndicatorBetween,
  DropIndicatorEnd,
  TaskWrapper,
} from "./Column.styles";
import { Task } from "../KanbanBoard";
import TaskCard from "../TaskCard/TaskCard";

interface ColumnProps {
  tasks: Task[];
  status: TaskStatus;
  onTaskDrop?: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
}

export const Column = ({ tasks, status, onTaskDrop }: ColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedTaskId, setDroppedTaskId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
    setIsDragging(true);

    // Calculate position within the column to determine insertion index
    if (tasks.length > 0) {
      const mouseY = e.clientY;
      const columnContentRect = e.currentTarget.getBoundingClientRect();
      let foundIndex: number | null = null;

      // Collect all task positions
      const taskPositions: Array<{
        index: number;
        top: number;
        bottom: number;
        midpoint: number;
      }> = [];

      for (let i = 0; i < tasks.length; i++) {
        const taskElement = e.currentTarget.querySelector(
          `[data-task-index="${i}"]`,
        ) as HTMLElement;
        if (taskElement) {
          const taskRect = taskElement.getBoundingClientRect();
          taskPositions.push({
            index: i,
            top: taskRect.top,
            bottom: taskRect.bottom,
            midpoint: taskRect.top + taskRect.height / 2,
          });
        }
      }

      if (taskPositions.length === 0) {
        // No tasks found, default to end
        setDragOverIndex(tasks.length);
        return;
      }

      // Check if above the first task or in the top half of the first task
      const firstTask = taskPositions[0];

      // Priority 1: ALWAYS check first - if mouse is anywhere in the top area, insert at position 0
      // This includes: empty space at top, above first task, or top half of first task
      const relativeY = mouseY - columnContentRect.top;
      const firstTaskRelativeTop = firstTask.top - columnContentRect.top;
      const firstTaskRelativeMidpoint =
        firstTask.midpoint - columnContentRect.top;

      // If mouse is above the midpoint of the first task (relative to column content)
      // OR in the empty space at the very top (first 150px)
      if (relativeY < firstTaskRelativeMidpoint || relativeY < 150) {
        foundIndex = 0;
      }
      // Priority 2: Check if below the last task
      else if (mouseY > taskPositions[taskPositions.length - 1].bottom + 25) {
        foundIndex = tasks.length;
      }
      // Priority 4: Check positions between and on tasks
      else {
        for (let i = 0; i < taskPositions.length; i++) {
          const currentTask = taskPositions[i];
          const nextTask = taskPositions[i + 1];

          // Check if mouse is in the gap between this task and the next
          // Priority: check gaps first to avoid double indicators
          if (
            nextTask &&
            mouseY > currentTask.bottom &&
            mouseY < nextTask.top
          ) {
            // In the gap between tasks = insert at position i + 1 (after current task, before next)
            foundIndex = i + 1;
            break;
          }
          // If mouse is on this task (but not first task, as that's handled above)
          else if (
            i > 0 &&
            mouseY >= currentTask.top &&
            mouseY <= currentTask.bottom
          ) {
            // Top half = insert before (at index i), bottom half = insert after (at index i + 1)
            foundIndex = mouseY < currentTask.midpoint ? i : i + 1;
            break;
          }
        }
      }

      // Default fallback
      if (foundIndex === null) {
        foundIndex = tasks.length;
      }

      setDragOverIndex(foundIndex);
    } else {
      // Empty column
      setDragOverIndex(0);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the drop zone itself
    // (not moving to a child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);
    setIsDragging(false);

    try {
      const dataString = e.dataTransfer.getData("text/plain");
      if (!dataString) {
        console.error("No data found in drop event");
        return;
      }

      const data = JSON.parse(dataString);
      const taskId = data.taskId;

      if (!taskId || !onTaskDrop) {
        console.error("Missing taskId or onTaskDrop handler", {
          taskId,
          onTaskDrop: !!onTaskDrop,
        });
        return;
      }

      // Calculate target index based on drop position
      let targetIndex: number | undefined;
      if (dragOverIndex !== null && dragOverIndex >= 0) {
        // Clamp to valid range
        targetIndex = Math.max(0, Math.min(dragOverIndex, tasks.length));
      } else if (tasks.length === 0) {
        // Empty column - place at index 0
        targetIndex = 0;
      } else if (isDragOver && tasks.length > 0) {
        // Dropped in the column but not on a specific task - place at the end
        targetIndex = tasks.length;
      } else {
        // Default to end
        targetIndex = tasks.length;
      }

      // Track the dropped task for animation
      setDroppedTaskId(taskId);

      // Remove animation class after animation completes
      setTimeout(() => {
        setDroppedTaskId(null);
      }, 400); // Match animation duration

      onTaskDrop(taskId, status, targetIndex);
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  const handleTaskDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    // Let the parent handle drag over to avoid conflicts
    // This handler is kept for compatibility but parent ColumnContent handles positioning
    e.preventDefault();
    e.stopPropagation();
  };

  // Listen for global drag events
  React.useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => {
      setIsDragging(false);
      setIsDragOver(false);
      setDragOverIndex(null);
    };

    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragend", handleDragEnd);
    };
  }, []);
  const getStatusIcon = () => {
    switch (status) {
      case TaskStatus.TODO:
        return "◯";
      case TaskStatus.IN_PROGRESS:
        return "◐";
      case TaskStatus.DONE:
        return "✓";
      default:
        return "◯";
    }
  };
  return (
    <ColumnStyles>
      <ColumnHeader>
        <ColumnTitle>
          <StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
          <span>{status}</span>
          <Count>{tasks.length}</Count>
        </ColumnTitle>
      </ColumnHeader>
      <ColumnContent
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        $isDragOver={isDragOver}
        $isEmpty={tasks.length === 0}
      >
        {/* Placeholder at the top when dragging over empty column or before first task */}
        {isDragging && tasks.length === 0 && isDragOver && (
          <EmptyColumnTopIndicator />
        )}

        {/* Empty column placeholder - only show when dragging */}
        {tasks.length === 0 && isDragging && (
          <EmptyColumnPlaceholder $isDragOver={isDragOver} />
        )}

        {/* Indicator at the top when inserting as first item */}
        {isDragging &&
          tasks.length > 0 &&
          dragOverIndex === 0 &&
          dragOverIndex !== null && <DropIndicator />}

        {tasks.map((task, index) => (
          <React.Fragment key={task.id}>
            {/* Indicator between tasks - show above this task when inserting at position index */}
            {/* This means: insert after task[index-1], before task[index] */}
            {isDragging &&
              index > 0 &&
              dragOverIndex === index &&
              dragOverIndex !== null && <DropIndicatorBetween />}
            <TaskWrapper
              data-task-index={index}
              onDragOver={(e) => handleTaskDragOver(e, index)}
              $isDropped={droppedTaskId === task.id}
            >
              <TaskCard task={task} />
              {/* Don't show indicator below task - we show it after all tasks instead */}
            </TaskWrapper>
          </React.Fragment>
        ))}

        {/* Indicator after last task when dragging to insert at the end */}
        {/* Only show ONE indicator when inserting at the end */}
        {isDragging &&
          tasks.length > 0 &&
          dragOverIndex === tasks.length &&
          dragOverIndex !== null && <DropIndicatorEnd />}
      </ColumnContent>
    </ColumnStyles>
  );
};
