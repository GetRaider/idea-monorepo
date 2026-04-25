"use client";

import { CopyIcon, CloseIcon, TrashIcon } from "@/components/Icons";
import { Task } from "../../Boards/KanbanBoard/types";
import { CloseButton } from "@/components/Buttons";
import {
  TaskViewDialogHeader,
  HeaderLeft,
  HeaderRight,
  StatusIconButton,
  DeleteButton,
} from "../TaskView.ui";
import { TaskViewBreadcrumbs } from "../TaskViewBreadcrumbs/TaskViewBreadcrumbs";

export function TaskViewHeader({
  boardDisplayName,
  boardOptions,
  onBoardSelect,
  boardPickerDisabled,
  parentTask,
  onNavigateToParentTask,
  task,
  onClose,
  onDelete,
  onDuplicate,
  isCreating = false,
}: TaskViewHeaderProps) {
  return (
    <TaskViewDialogHeader>
      <HeaderLeft>
        <TaskViewBreadcrumbs
          boardDisplayName={boardDisplayName}
          boardOptions={boardOptions}
          onBoardSelect={onBoardSelect}
          boardPickerDisabled={boardPickerDisabled}
          parentTask={parentTask}
          onParentTaskClick={onNavigateToParentTask}
          task={task}
        />
        {!isCreating && onDuplicate && (
          <StatusIconButton title="Duplicate task" onClick={onDuplicate}>
            <CopyIcon size={15} />
          </StatusIconButton>
        )}
      </HeaderLeft>
      <HeaderRight>
        {!isCreating && onDelete && (
          <DeleteButton onClick={onDelete} title="Delete task">
            <TrashIcon size={16} />
          </DeleteButton>
        )}
        <CloseButton
          onClick={onClose}
          title="Close"
          className="transition-colors duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        >
          <CloseIcon />
        </CloseButton>
      </HeaderRight>
    </TaskViewDialogHeader>
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
  onClose: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isCreating?: boolean;
}
