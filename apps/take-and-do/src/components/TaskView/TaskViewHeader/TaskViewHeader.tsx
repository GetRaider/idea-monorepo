"use client";

import { TrashIcon, CloseIcon } from "@/components/Icons";
import { Task, TaskStatus } from "../../Boards/KanbanBoard/types";
import { CloseButton } from "@/components/Buttons";
import {
  ModalHeader,
  HeaderLeft,
  HeaderRight,
  DeleteButton,
} from "../TaskView.styles";
import { TaskViewBreadcrumbs } from "../TaskViewBreadcrumbs/TaskViewBreadcrumbs";

export function TaskViewHeader({
  boardDisplayName,
  boardOptions,
  onBoardSelect,
  boardPickerDisabled,
  parentTask,
  onNavigateToParentTask,
  task,
  onStatusSelect,
  onClose,
  onDelete,
  isCreating = false,
}: TaskViewHeaderProps) {
  return (
    <ModalHeader>
      <HeaderLeft>
        <TaskViewBreadcrumbs
          boardDisplayName={boardDisplayName}
          boardOptions={boardOptions}
          onBoardSelect={onBoardSelect}
          boardPickerDisabled={boardPickerDisabled}
          parentTask={parentTask}
          onParentTaskClick={onNavigateToParentTask}
          task={task}
          onStatusSelect={onStatusSelect}
        />
      </HeaderLeft>
      <HeaderRight>
        {!isCreating && onDelete && (
          <DeleteButton onClick={onDelete} title="Delete task">
            <TrashIcon size={16} />
          </DeleteButton>
        )}
        <CloseButton onClick={onClose} title="Close">
          <CloseIcon />
        </CloseButton>
      </HeaderRight>
    </ModalHeader>
  );
}

interface TaskBoardOption {
  id: string;
  name: string;
}

interface TaskViewHeaderProps {
  boardDisplayName: string;
  boardOptions: TaskBoardOption[];
  onBoardSelect: (boardId: string) => void;
  boardPickerDisabled: boolean;
  task: Task;
  parentTask?: Task | null;
  onNavigateToParentTask?: () => void;
  onStatusSelect: (status: TaskStatus) => void;
  onClose: () => void;
  onDelete?: () => void;
  isCreating?: boolean;
}
