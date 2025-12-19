"use client";

import { useState } from "react";
import { Task, TaskPriority, TaskStatus } from "../../KanbanBoard/types";
import { tasksService } from "@/services/api/tasks.service";
import { getStatusIcon } from "../../KanbanBoard/Column/Column";
import { StatusIcon } from "../../KanbanBoard/Column/Column.styles";
import { getPriorityIconLabel } from "../../KanbanBoard/TaskCard/TaskCard";
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

interface TaskSubtasksProps {
  task: Task;
  onSubtaskClick?: (subtask: Task) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
}

export default function TaskSubtasks({
  task,
  onSubtaskClick,
  onTaskUpdate,
}: TaskSubtasksProps) {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [newSubtaskSummary, setNewSubtaskSummary] = useState("");

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

    try {
      const newSubtask: Partial<Task> = {
        taskBoardId: task.taskBoardId,
        summary: newSubtaskSummary.trim(),
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        subtasks: [],
      };

      const existingSubtasks = (task.subtasks || []).map((st) => ({
        ...st,
        dueDate:
          st.dueDate instanceof Date ? st.dueDate.toISOString() : st.dueDate,
      }));

      const updatedSubtasks = [...existingSubtasks, newSubtask];
      const updatedTask = await tasksService.update(task.id, {
        subtasks: updatedSubtasks as Task[],
      });

      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      setNewSubtaskSummary("");
      setIsCreatingSubtask(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
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
            +
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
                  handleCreateSubtask();
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
                    {getStatusIcon(subtask.status)}
                  </StatusIcon>
                  <SubtaskIcon>
                    {getPriorityIconLabel(subtask.priority)}
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

