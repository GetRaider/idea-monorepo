"use client";

import { useState, useRef } from "react";
import { Task, TaskPriority, TaskStatus } from "../../Boards/KanbanBoard/types";
import { apiServices } from "@/services/api";
import { StatusIcon } from "../../Boards/KanbanBoard/Column/Column.styles";
import {
  SubtasksSection,
  SubtasksHeader,
  SubtasksHeaderButtons,
  SubtasksHeaderButton,
  SubtasksContainer,
  SubtaskItem,
  SubtaskHeader,
  SubtaskKey,
  SubtaskIcon,
  SubtaskContent,
  SubtaskInput,
  EmptySubtasksMessage,
} from "./TaskSubtasks.styles";
import { tasksHelper } from "@/helpers/task.helper";
import { PlusIcon } from "@/components/Icons";

interface TaskSubtasksProps {
  task: Task;
  onSubtaskClick?: (subtask: Task) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
}

export function TaskSubtasks({
  task,
  onSubtaskClick,
  onTaskUpdate,
}: TaskSubtasksProps) {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [newSubtaskSummary, setNewSubtaskSummary] = useState("");
  const isSavingSubtaskRef = useRef(false);

  const handleSubtaskClick = (subtask: Task) => {
    if (onSubtaskClick) {
      onSubtaskClick(subtask);
    }
  };

  const handleToggleSubtasks = () => {
    setIsSubtasksExpanded(!isSubtasksExpanded);
  };

  const handleCreateSubtask = async () => {
    if (!task || !newSubtaskSummary.trim()) return;
    if (isSavingSubtaskRef.current) return;
    isSavingSubtaskRef.current = true;

    try {
      const newSubtask: Partial<Task> = {
        taskBoardId: task.taskBoardId,
        summary: newSubtaskSummary.trim(),
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        subtasks: [],
      };

      // TODO: Kill this shit
      const existingSubtasks = (task.subtasks || []).map((st) => ({
        ...st,
        dueDate:
          st.dueDate instanceof Date ? st.dueDate.toISOString() : st.dueDate,
      }));

      const updatedSubtasks = [...existingSubtasks, newSubtask];
      const updatedTask = await apiServices.tasks.update(task.id, {
        subtasks: updatedSubtasks as Task[],
      });

      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      setNewSubtaskSummary("");
      setIsCreatingSubtask(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
    } finally {
      isSavingSubtaskRef.current = false;
    }
  };

  return (
    <SubtasksSection>
      <SubtasksHeader>
        <span>Subtasks</span>
        <SubtasksHeaderButtons>
          <SubtasksHeaderButton
            onClick={() => setIsCreatingSubtask(true)}
            title="Add subtask"
          >
            <PlusIcon />
          </SubtasksHeaderButton>
          <SubtasksHeaderButton
            onClick={handleToggleSubtasks}
            title={isSubtasksExpanded ? "Collapse" : "Expand"}
          >
            {isSubtasksExpanded ? "▼" : "▶"}
          </SubtasksHeaderButton>
        </SubtasksHeaderButtons>
      </SubtasksHeader>
      <SubtasksContainer $isExpanded={isSubtasksExpanded}>
        {isCreatingSubtask && (
          <div style={{ marginBottom: "8px" }}>
            <SubtaskInput
              type="text"
              value={newSubtaskSummary}
              onChange={(e) => setNewSubtaskSummary(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateSubtask();
                } else if (e.key === "Escape") {
                  setIsCreatingSubtask(false);
                  setNewSubtaskSummary("");
                }
              }}
              placeholder="Enter subtask summary..."
              autoFocus
              onBlur={() => {
                if (!newSubtaskSummary.trim()) {
                  setIsCreatingSubtask(false);
                }
              }}
            />
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 ? (
          task.subtasks.map((subtask, index) => {
            return (
              <SubtaskItem
                key={subtask.id || index}
                onClick={() => handleSubtaskClick(subtask)}
              >
                <SubtaskHeader>
                  <StatusIcon $status={subtask.status}>
                    {tasksHelper.status.getIcon(subtask.status)}
                  </StatusIcon>
                  <SubtaskIcon>
                    {tasksHelper.priority.getIconLabel(subtask.priority)}
                  </SubtaskIcon>
                  {subtask.taskKey && (
                    <SubtaskKey>{subtask.taskKey}</SubtaskKey>
                  )}
                </SubtaskHeader>
                <SubtaskContent>{subtask.summary}</SubtaskContent>
              </SubtaskItem>
            );
          })
        ) : !isCreatingSubtask ? (
          <EmptySubtasksMessage>No subtasks yet</EmptySubtasksMessage>
        ) : null}
      </SubtasksContainer>
    </SubtasksSection>
  );
}
