"use client";

import { RefObject } from "react";
import { TrashIcon, CloseIcon } from "@/components/Icons";
import { Task, TaskStatus } from "../../KanbanBoard/types";
import { StatusIcon } from "../../KanbanBoard/Column/Column.styles";
import {
  ModalHeader,
  HeaderLeft,
  HeaderRight,
  DeleteButton,
  CloseButton,
  StatusIconButton,
  DropdownContainer,
  DropdownItem,
} from "../TaskView.styles";
import { tasksHelper } from "@/helpers/task.helper";

interface TaskViewHeaderProps {
  workspaceTitle: string;
  task: Task;
  parentTask?: Task | null;
  statusDropdownRef: RefObject<HTMLDivElement>;
  isStatusDropdownOpen: boolean;
  onStatusClick: () => void;
  onStatusSelect: (status: TaskStatus) => void;
  onClose: () => void;
  onDelete?: () => void;
  isCreating?: boolean;
}

export function TaskViewHeader({
  workspaceTitle,
  task,
  parentTask,
  statusDropdownRef,
  isStatusDropdownOpen,
  onStatusClick,
  onStatusSelect,
  onClose,
  onDelete,
  isCreating = false,
}: TaskViewHeaderProps) {
  return (
    <ModalHeader>
      <HeaderLeft>
        {workspaceTitle}{" "}
        <img
          src="/breadcrumb-chevron.svg"
          alt="arrow-right"
          style={{ marginLeft: "8px" }}
          width={14}
          height={14}
        />
        {parentTask?.taskKey && (
          <>
            <span style={{ marginLeft: "8px" }}>{parentTask.taskKey}</span>
            <img
              src="/breadcrumb-chevron.svg"
              alt="arrow-right"
              style={{ marginLeft: "8px" }}
              width={14}
              height={14}
            />
          </>
        )}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
          ref={statusDropdownRef}
        >
          <StatusIconButton onClick={onStatusClick}>
            <StatusIcon $status={task.status}>
              {tasksHelper.status.getIcon(task.status)}
            </StatusIcon>
          </StatusIconButton>
          <DropdownContainer $isOpen={isStatusDropdownOpen}>
            {Object.values(TaskStatus).map((status) => (
              <DropdownItem key={status} onClick={() => onStatusSelect(status)}>
                <span style={{ marginRight: "8px" }}>
                  <StatusIcon $status={status}>
                    {tasksHelper.status.getIcon(status)}
                  </StatusIcon>
                </span>
                {status}
              </DropdownItem>
            ))}
          </DropdownContainer>
        </div>{" "}
        {task.taskKey}
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
