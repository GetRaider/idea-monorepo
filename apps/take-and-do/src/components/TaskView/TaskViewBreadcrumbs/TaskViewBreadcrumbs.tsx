"use client";

import { useEffect, useRef, useState, type Ref } from "react";

import { StatusIcon } from "../../Boards/KanbanBoard/Column/Column.styles";
import { Task, TaskStatus } from "../../Boards/KanbanBoard/types";
import {
  DropdownContainer,
  DropdownItem,
  StatusIconButton,
} from "../TaskView.styles";
import { tasksHelper } from "@/helpers/task.helper";

import {
  BoardDropdownItem,
  BoardDropdownPanel,
  BoardDropdownWrap,
  BoardTrigger,
  BreadcrumbChevron,
  BreadcrumbsRow,
  ParentTaskButton,
  StatusDropdownWrap,
  TaskKeyText,
} from "./TaskViewBreadcrumbs.styles";

export function TaskViewBreadcrumbs({
  boardDisplayName,
  boardOptions,
  onBoardSelect,
  boardPickerDisabled,
  parentTask,
  onParentTaskClick,
  task,
  onStatusSelect,
}: TaskViewBreadcrumbsProps) {
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const t = event.target as Node;
      if (boardRef.current && !boardRef.current.contains(t)) {
        setIsBoardOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(t)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleBoardTriggerClick = () => {
    if (boardPickerDisabled) return;
    setIsBoardOpen((open) => !open);
  };

  const handleBoardPick = (boardId: string) => {
    setIsBoardOpen(false);
    onBoardSelect(boardId);
  };

  const handleStatusClick = () => setIsStatusOpen((open) => !open);

  const handleStatusPick = (status: TaskStatus) => {
    setIsStatusOpen(false);
    onStatusSelect(status);
  };

  return (
    <BreadcrumbsRow>
      <BoardDropdownWrap ref={boardRef as Ref<HTMLDivElement>}>
        <BoardTrigger
          type="button"
          onClick={handleBoardTriggerClick}
          disabled={boardPickerDisabled}
          title={boardDisplayName}
        >
          {boardDisplayName}
        </BoardTrigger>
        <BoardDropdownPanel $isOpen={isBoardOpen}>
          {boardOptions.map((opt) => (
            <BoardDropdownItem
              key={opt.id}
              type="button"
              onClick={() => handleBoardPick(opt.id)}
            >
              {opt.name}
            </BoardDropdownItem>
          ))}
        </BoardDropdownPanel>
      </BoardDropdownWrap>
      <BreadcrumbChevron src="/breadcrumb-chevron.svg" alt="" aria-hidden />
      {parentTask?.taskKey ? (
        <>
          <ParentTaskButton
            type="button"
            onClick={onParentTaskClick}
            title="Open parent task"
          >
            {parentTask.taskKey}
          </ParentTaskButton>
          <BreadcrumbChevron src="/breadcrumb-chevron.svg" alt="" aria-hidden />
        </>
      ) : null}
      <StatusDropdownWrap ref={statusRef as Ref<HTMLDivElement>}>
        <StatusIconButton type="button" onClick={handleStatusClick}>
          <StatusIcon $status={task.status}>
            {tasksHelper.status.getIcon(task.status)}
          </StatusIcon>
        </StatusIconButton>
        <DropdownContainer $isOpen={isStatusOpen}>
          {Object.values(TaskStatus).map((status) => (
            <DropdownItem key={status} onClick={() => handleStatusPick(status)}>
              <span style={{ marginRight: "8px" }}>
                <StatusIcon $status={status}>
                  {tasksHelper.status.getIcon(status)}
                </StatusIcon>
              </span>
              {status}
            </DropdownItem>
          ))}
        </DropdownContainer>
      </StatusDropdownWrap>
      {task.taskKey ? <TaskKeyText>{task.taskKey}</TaskKeyText> : null}
    </BreadcrumbsRow>
  );
}

interface TaskBoardOption {
  id: string;
  name: string;
}

interface TaskViewBreadcrumbsProps {
  boardDisplayName: string;
  boardOptions: TaskBoardOption[];
  onBoardSelect: (boardId: string) => void;
  boardPickerDisabled: boolean;
  parentTask?: Task | null;
  onParentTaskClick?: () => void;
  task: Task;
  onStatusSelect: (status: TaskStatus) => void;
}
