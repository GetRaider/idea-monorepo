"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import { BoardTitleEmoji } from "@/components/Boards/KanbanBoard/KanbanBoard.ui";
import { PrimaryButton } from "@/components/Buttons";
import { ClockCircleIcon, ClockNavIcon, PlusIcon } from "@/components/Icons";
import { LightningMenu } from "@/components/LightningMenu";
import { useTasksShellHeaderExtras, useWorkspace } from "@/contexts";
import {
  APP_CHROME_NAV_ICON_PX,
  APP_CHROME_TITLE_ACTION_ROW,
} from "@/helpers/app-chrome-layout";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import type { TasksBreadcrumb } from "./TasksBreadcrumbs";
import { TasksBreadcrumbs } from "./TasksBreadcrumbs";
import { TASKS_HEADER_CREATE_TASK_EVENT } from "./tasks-header-events";
import { TaskSearchHeader } from "./TaskSearchHeader";
import { TaskBoard } from "@/types/workspace";

export function TasksHeader() {
  const pathname = usePathname() ?? "";
  const { openCreateWorkspace, taskBoards } = useWorkspace();
  const { settingsSlot } = useTasksShellHeaderExtras();

  const breadcrumps = useMemo((): TasksBreadcrumb[] => {
    if (getPathRegex("today").test(pathname)) {
      return [getBreadcrumbByType("root"), getBreadcrumbByType("today")];
    }
    if (getPathRegex("tomorrow").test(pathname)) {
      return [getBreadcrumbByType("root"), getBreadcrumbByType("tomorrow")];
    }

    const boardName = tasksUrlHelper.routing.getBoardNameFromPathname(pathname);
    const board = taskBoards.find((b) => b.name === boardName);

    if (board?.name) {
      return [getBreadcrumbByType("root"), getBreadcrumbByType("board")(board)];
    }

    return [getBreadcrumbByType("root")];
  }, [pathname, taskBoards]);

  const isRoot = getPathRegex("root").test(pathname);
  const onPrimary = useCallback(() => {
    isRoot
      ? openCreateWorkspace()
      : window.dispatchEvent(new CustomEvent(TASKS_HEADER_CREATE_TASK_EVENT));
  }, [isRoot, openCreateWorkspace]);

  return (
    <div className={APP_CHROME_TITLE_ACTION_ROW}>
      <TasksBreadcrumbs breadcrumbs={breadcrumps} className="min-w-0 flex-1" />
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
        <LightningMenu className="shrink-0" />
      </div>
    </div>
  );
}

function getBreadcrumbByType(
  name: "board",
): (board: TaskBoard) => TasksBreadcrumb;
function getBreadcrumbByType(
  name: "root" | "today" | "tomorrow",
): TasksBreadcrumb;

function getBreadcrumbByType(
  name: "root" | "today" | "tomorrow" | "board",
): TasksBreadcrumb | ((board: TaskBoard) => TasksBreadcrumb) {
  const breadcrumbs = {
    root: {
      label: "Tasks",
      href: tasksUrlHelper.routing.buildRootUrl(),
      leading: (
        <Image
          width={APP_CHROME_NAV_ICON_PX}
          height={APP_CHROME_NAV_ICON_PX}
          src="/tasks.svg"
          alt=""
          className="shrink-0 opacity-95"
        />
      ),
    },
    today: {
      label: "Today",
      href: tasksUrlHelper.routing.buildScheduleUrl("today"),
      leading: <ClockNavIcon size={22} className="shrink-0 opacity-90" />,
    },
    tomorrow: {
      label: "Tomorrow",
      href: tasksUrlHelper.routing.buildScheduleUrl("tomorrow"),
      leading: <ClockCircleIcon size={22} className="shrink-0 opacity-90" />,
    },
    board: (board: TaskBoard): TasksBreadcrumb => {
      return {
        label: board.name,
        href: tasksUrlHelper.routing.buildBoardUrl(board.name),
        leading: board?.emoji ? (
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
        ),
      };
    },
  };
  return breadcrumbs[name];
}

function getPathRegex(name: string): RegExp {
  const pathRegexes = {
    root: /^\/tasks(?:\/|$)/,
    today: /^\/tasks\/schedule\/today(?:\/|$)/,
    tomorrow: /^\/tasks\/schedule\/tomorrow(?:\/|$)/,
  };
  return pathRegexes[name as keyof typeof pathRegexes];
}
