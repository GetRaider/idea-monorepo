"use client";

import { RefObject } from "react";
import { Task, TaskStatus } from "../../KanbanBoard/types";
import { getStatusIcon } from "../../KanbanBoard/Column/Column";
import { StatusIcon } from "../../KanbanBoard/Column/Column.styles";
import {
  ModalHeader,
  HeaderLeft,
  CloseButton,
  StatusIconButton,
  DropdownContainer,
  DropdownItem,
} from "../TaskView.styles";

interface TaskViewHeaderProps {
  workspaceTitle: string;
  task: Task;
  parentTask?: Task | null;
  statusDropdownRef: RefObject<HTMLDivElement>;
  isStatusDropdownOpen: boolean;
  onStatusClick: () => void;
  onStatusSelect: (status: TaskStatus) => void;
  onClose: () => void;
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
              {getStatusIcon(task.status)}
            </StatusIcon>
          </StatusIconButton>
          <DropdownContainer $isOpen={isStatusDropdownOpen}>
            {Object.values(TaskStatus).map((status) => (
              <DropdownItem key={status} onClick={() => onStatusSelect(status)}>
                <span style={{ marginRight: "8px" }}>
                  <StatusIcon $status={status}>
                    {getStatusIcon(status)}
                  </StatusIcon>
                </span>
                {status}
              </DropdownItem>
            ))}
          </DropdownContainer>
        </div>{" "}
        {task.taskKey}
      </HeaderLeft>
      <CloseButton onClick={onClose} title="Close">
        ×
      </CloseButton>
    </ModalHeader>
  );
}
