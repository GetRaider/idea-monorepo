"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from "react";

import { StatusIcon } from "../../Boards/KanbanBoard/Column/Column.ui";
import { Task, TaskStatus } from "../../Boards/KanbanBoard/types";
import {
  DropdownContainer,
  DropdownItem,
  StatusIconButton,
} from "../TaskView.ui";
import { tasksHelper } from "@/helpers/task.helper";
import { MenuRowButton } from "@/components/MenuRowButton/MenuRowButton";
import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

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
        <BoardDropdownPanel isOpen={isBoardOpen}>
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
          <StatusIcon status={task.status}>
            {tasksHelper.status.getIcon(task.status)}
          </StatusIcon>
        </StatusIconButton>
        <DropdownContainer isOpen={isStatusOpen}>
          {Object.values(TaskStatus).map((status) => (
            <DropdownItem key={status} onClick={() => handleStatusPick(status)}>
              <span style={{ marginRight: "8px" }}>
                <StatusIcon status={status}>
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

function BreadcrumbsRow({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

type BreadcrumbChevronProps = ComponentProps<typeof Image>;

function BreadcrumbChevron({
  className,
  width = 14,
  height = 14,
  alt = "",
  ...props
}: BreadcrumbChevronProps) {
  return (
    <Image
      alt={alt}
      width={width}
      height={height}
      className={cn("mx-1 block h-3.5 w-3.5 shrink-0", className)}
      {...props}
    />
  );
}

function BoardTrigger({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "m-0 max-w-[200px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-0 bg-transparent px-1.5 py-1 font-inherit text-base text-[#888] transition-colors hover:bg-[#2a2a2a] hover:text-white disabled:cursor-default disabled:opacity-70 hover:disabled:bg-transparent hover:disabled:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

function BoardDropdownWrap({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("relative flex min-w-0 items-center", className)}
      {...props}
    />
  );
}

type BoardDropdownPanelProps = UiProps<"div"> & {
  isOpen: boolean;
};

function BoardDropdownPanel({
  className,
  isOpen,
  ref,
  ...props
}: BoardDropdownPanelProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-[1001] mt-1 max-h-60 min-w-[180px] overflow-y-auto rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  );
}

function BoardDropdownItem({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <MenuRowButton
      ref={ref}
      type={type}
      rowTransition="colors"
      className={className}
      {...props}
    />
  );
}

function ParentTaskButton({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "m-0 cursor-pointer rounded-md border-0 bg-transparent px-1.5 py-1 font-inherit text-base text-[#888] hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

function StatusDropdownWrap({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("relative flex items-center", className)}
      {...props}
    />
  );
}

function TaskKeyText({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn("ml-1 text-base text-[#888]", className)}
      {...props}
    />
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
