"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import { BoardTitleEmoji } from "@/components/Boards/KanbanBoard/KanbanBoard.ui";
import { PrimaryButton } from "@/components/Buttons";
import { ClockCircleIcon, ClockNavIcon, PlusIcon } from "@/components/Icons";
import { useTasksShellHeaderExtras, useWorkspace } from "@/contexts";
import { Route } from "@/constants/route.constant";
import {
  APP_CHROME_NAV_ICON_PX,
  APP_CHROME_TITLE_ACTION_ROW,
} from "@/helpers/app-chrome-layout";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

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
    const tasksIcon = (
      <Image
        width={APP_CHROME_NAV_ICON_PX}
        height={APP_CHROME_NAV_ICON_PX}
        src="/tasks.svg"
        alt=""
        className="shrink-0 opacity-95"
      />
    );
    const tasksLinkSeg: TasksBreadcrumbSegment = {
      label: "Tasks",
      href: rootHref,
      leading: tasksIcon,
    };

    if (normalized === Route.TASKS) {
      return [{ label: "Tasks", leading: tasksIcon }];
    }
    if (/^\/tasks\/schedule\/today(?:\/|$)/.test(pathname)) {
      return [
        tasksLinkSeg,
        {
          label: "Today",
          leading: <ClockNavIcon size={22} className="shrink-0 opacity-90" />,
        },
      ];
    }
    if (/^\/tasks\/schedule\/tomorrow(?:\/|$)/.test(pathname)) {
      return [
        tasksLinkSeg,
        {
          label: "Tomorrow",
          leading: (
            <ClockCircleIcon size={22} className="shrink-0 opacity-90" />
          ),
        },
      ];
    }
    const boardName = tasksUrlHelper.routing.getBoardNameFromPathname(pathname);
    if (boardName) {
      const board = taskBoards.find((b) => b.name === boardName);
      const leading = board?.emoji ? (
        <BoardTitleEmoji className="text-[1.25rem] leading-none">
          {board.emoji}
        </BoardTitleEmoji>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
          <Image
            width={20}
            height={20}
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
    <div className={APP_CHROME_TITLE_ACTION_ROW}>
      <TasksBreadcrumbs segments={segments} className="min-w-0 flex-1" />
      <div className="flex shrink-0 items-center justify-end gap-3">
        <TaskSearchHeader taskBoards={taskBoards} />
        <PrimaryButton
          size="sm"
          onClick={onPrimary}
          className="shrink-0 font-medium"
        >
          <PlusIcon size={18} className="shrink-0" />
          {isRoot ? "Create Workspace" : "Create Task"}
        </PrimaryButton>
        {!isRoot && settingsSlot ? (
          <div className="flex shrink-0 items-center">{settingsSlot}</div>
        ) : null}
      </div>
    </div>
  );
}
