"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import { BoardTitleEmoji } from "@/components/Boards/KanbanBoard/KanbanBoard.ui";
import { PrimaryButton } from "@/components/Buttons";
import { ClockCircleIcon, ClockNavIcon, PlusIcon } from "@/components/Icons";
import { useTasksShellHeaderExtras, useWorkspace } from "@/contexts";
import { Route } from "@/constants/route.constant";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { cn } from "@/lib/styles/utils";

import type { TasksBreadcrumbSegment } from "./TasksBreadcrumbs";
import { TasksBreadcrumbs } from "./TasksBreadcrumbs";
import { TASKS_HEADER_CREATE_TASK_EVENT } from "./tasks-header-events";
import { TaskSearchHeader } from "./TaskSearchHeader";

export function TasksAppChromeHeader() {
  const pathname = usePathname() ?? "";
  const { openCreateWorkspace, taskBoards } = useWorkspace();
  const { settingsSlot } = useTasksShellHeaderExtras();

  const segments = useMemo((): TasksBreadcrumbSegment[] => {
    const rootHref = tasksUrlHelper.routing.buildRootUrl();
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const tasksLinkSeg: TasksBreadcrumbSegment = {
      label: "Tasks",
      href: rootHref,
    };

    if (normalized === Route.TASKS) {
      return [{ label: "Tasks" }];
    }
    if (/^\/tasks\/schedule\/today(?:\/|$)/.test(pathname)) {
      return [
        tasksLinkSeg,
        {
          label: "Today",
          leading: <ClockNavIcon size={20} className="shrink-0 opacity-90" />,
        },
      ];
    }
    if (/^\/tasks\/schedule\/tomorrow(?:\/|$)/.test(pathname)) {
      return [
        tasksLinkSeg,
        {
          label: "Tomorrow",
          leading: (
            <ClockCircleIcon size={20} className="shrink-0 opacity-90" />
          ),
        },
      ];
    }
    const boardName = tasksUrlHelper.routing.getBoardNameFromPathname(pathname);
    if (boardName) {
      const board = taskBoards.find((b) => b.name === boardName);
      const leading = board?.emoji ? (
        <BoardTitleEmoji className="text-[1.125rem] leading-none">
          {board.emoji}
        </BoardTitleEmoji>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
          <Image
            width={18}
            height={18}
            src="/kanban-board.svg"
            alt=""
            className="opacity-90"
          />
        </span>
      );
      return [tasksLinkSeg, { label: boardName, leading }];
    }
    return [tasksLinkSeg];
  }, [pathname, taskBoards]);

  const isRoot = (pathname.replace(/\/+$/, "") || "/") === Route.TASKS;

  const onPrimary = useCallback(() => {
    if (isRoot) openCreateWorkspace();
    else window.dispatchEvent(new CustomEvent(TASKS_HEADER_CREATE_TASK_EVENT));
  }, [isRoot, openCreateWorkspace]);

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
      )}
    >
      <TasksBreadcrumbs segments={segments} className="min-w-0 flex-1" />
      <div className="flex shrink-0 items-center justify-end gap-3 self-end sm:self-auto">
        <TaskSearchHeader taskBoards={taskBoards} />
        <PrimaryButton
          size="sm"
          onClick={onPrimary}
          className="shrink-0 font-medium"
        >
          <PlusIcon size={18} className="shrink-0 text-white" />
          {isRoot ? "Create Workspace" : "Create Task"}
        </PrimaryButton>
        {!isRoot && settingsSlot ? (
          <div className="flex shrink-0 items-center">{settingsSlot}</div>
        ) : null}
      </div>
    </div>
  );
}
