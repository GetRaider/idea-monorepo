"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import type { Space, SpaceFolder, Task } from "@repo/api/todex";
import { TaskStatus } from "@repo/api/todex";

import {
  CalendarDaysIcon,
  CounterIcon,
  FolderIcon,
  GoalIcon,
  InboxIcon,
  PlanningIcon,
  PlusIcon,
  SunIcon,
  SunriseIcon,
} from "@components/icons";
import { ResizeHandle } from "@components/resize-handle";
import { SpaceSwatch } from "@components/space-swatch";
import { SpacesSidebarList } from "@components/spaces-sidebar";
import {
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
} from "@/helpers/panel-layout";
import {
  readTasksSidebarWidth,
  writeTasksSidebarWidth,
} from "@/helpers/tasks-sidebar-open";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { todexClient } from "@lib/todex-client";
import { useCalendarEnabled } from "../settings/use-calendar-enabled";
import { useCountersEnabled } from "../settings/use-counters-enabled";

import {
  ModuleSidebarFrame,
  useModuleSidebar,
} from "@components/module-sidebar";

import { useTasks } from "./tasks-provider";
import { useSpaceDialogs } from "./space-dialogs";
import {
  earliestActiveSlotStart,
  localDayScheduleQuery,
  openSpaceTaskCount,
} from "./task-helpers";

export function TasksModuleSidebar() {
  const {
    state: { folders, boards, view },
    actions: { openCreateDialog },
  } = useTasks();
  const { open: isOpen } = useModuleSidebar();
  const pathname = usePathname() ?? "";
  const { enabled: calendarEnabled } = useCalendarEnabled();
  const { enabled: countersEnabled } = useCountersEnabled();
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);

  useEffect(() => {
    setWidth(readTasksSidebarWidth());
  }, []);

  const activeBoardId = view.kind === "board" ? view.spaceId : null;
  const inboxBoard = boards.find((board) => board.isInbox);
  const taskQuery = useQuery({
    queryKey: ["tasks", "root", boards.map((board) => board.id).join("\n")],
    enabled: boards.length > 0,
    queryFn: () =>
      Promise.all(
        boards.map((board) => todexClient.tasks.list({ spaceId: board.id })),
      ).then((lists) => lists.flat()),
  });
  const countedTasks = taskQuery.data ?? [];
  const todayCount = scheduledCount(countedTasks, 0);
  const tomorrowCount = scheduledCount(countedTasks, 1);
  const spaceCount = (spaceId: string) =>
    openSpaceTaskCount(countedTasks, spaceId);

  return (
    <ModuleSidebarFrame open={isOpen} width={width}>
      <ResizeHandle
        label="Resize sidebar"
        edge="trailing"
        width={width}
        min={TASKS_SIDEBAR_MIN_WIDTH}
        max={TASKS_SIDEBAR_MAX_WIDTH}
        onWidth={setWidth}
        onCommit={writeTasksSidebarWidth}
      />
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3">
        <section className="mb-4 w-full">
          <h2 className="mb-2 px-2 text-sm text-muted-foreground">Views</h2>
          <NavRow
            href={tasksUrlHelper.routing.buildRootUrl()}
            active={tasksUrlHelper.routing.isRootPathname(pathname)}
            icon={<PlanningIcon size={16} />}
            label="Home"
          />
          {inboxBoard ? (
            <NavRow
              href={tasksUrlHelper.routing.buildBoardUrl(inboxBoard.id)}
              active={activeBoardId === inboxBoard.id}
              icon={<InboxIcon size={16} />}
              label="Inbox"
              count={spaceCount(inboxBoard.id)}
            />
          ) : null}
          <NavRow
            href={tasksUrlHelper.routing.buildScheduleUrl("today")}
            active={view.kind === "schedule" && view.schedule === "today"}
            icon={<SunIcon size={16} />}
            label="Today"
            count={todayCount}
          />
          <NavRow
            href={tasksUrlHelper.routing.buildScheduleUrl("tomorrow")}
            active={view.kind === "schedule" && view.schedule === "tomorrow"}
            icon={<SunriseIcon size={16} />}
            label="Tomorrow"
            count={tomorrowCount}
          />
          {countersEnabled ? (
            <NavRow
              href="/planning/counters"
              active={
                pathname === "/planning/counters" ||
                pathname.startsWith("/planning/counters/")
              }
              icon={<CounterIcon size={16} />}
              label="Counters"
            />
          ) : null}
          <NavRow
            href="/planning/goals"
            active={
              pathname === "/planning/goals" ||
              pathname.startsWith("/planning/goals/")
            }
            icon={<GoalIcon size={16} />}
            label="Goals"
          />
          {calendarEnabled ? (
            <NavRow
              href="/planning/calendar"
              active={
                pathname === "/planning/calendar" ||
                pathname.startsWith("/planning/calendar/")
              }
              icon={<CalendarDaysIcon size={16} />}
              label="Calendar"
            />
          ) : null}
        </section>
        <section className="flex min-h-0 w-full flex-1 flex-col overflow-auto">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-sm text-muted-foreground">Spaces</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={openCreateDialog}
                  aria-label="Create space or folder"
                >
                  <PlusIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Create space or folder
              </TooltipContent>
            </Tooltip>
          </div>
          <SpacesSidebarList
            spaces={boards}
            folders={folders}
            renderSpace={(board, nested) => ({
              menu: <BoardMenu board={board} />,
              content: (
                <NavRow
                  href={tasksUrlHelper.routing.buildBoardUrl(board.id)}
                  active={activeBoardId === board.id}
                  icon={<SpaceSwatch color={board.color} />}
                  label={board.name}
                  count={spaceCount(board.id)}
                  nested={nested}
                />
              ),
            })}
            renderFolder={(folder) => ({
              menu: <FolderMenu folder={folder} />,
              content: (
                <>
                  <FolderIcon size={16} />
                  <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  <span className="w-8 shrink-0" />
                </>
              ),
            })}
          />
        </section>
      </div>
    </ModuleSidebarFrame>
  );
}

function NavRow({
  href,
  active,
  icon,
  label,
  count = 0,
  nested = false,
}: NavRowProps) {
  return (
    <div
      className={cn(
        "my-1 flex items-center rounded-lg",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      <Link
        href={href}
        aria-label={label}
        draggable={false}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm",
          nested && "pl-8",
        )}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {count > 0 ? count : null}
        </span>
      </Link>
    </div>
  );
}

function BoardMenu({ board }: { board: Space }) {
  const actions = useSpaceDialogs();
  return (
    <ContextMenuContent>
      <ContextMenuItem onSelect={() => actions.openRenameBoard(board)}>
        Rename
      </ContextMenuItem>
      {board.isInbox ? null : (
        <ContextMenuItem onSelect={() => actions.openMoveBoard(board)}>
          Move to folder
        </ContextMenuItem>
      )}
      {board.isInbox ? null : <ContextMenuSeparator />}
      {board.isInbox ? null : (
        <ContextMenuItem
          className="text-destructive"
          onSelect={() => actions.openDeleteBoard(board)}
        >
          Delete
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  );
}

function FolderMenu({ folder }: { folder: SpaceFolder }) {
  const actions = useSpaceDialogs();
  return (
    <ContextMenuContent>
      <ContextMenuItem onSelect={() => actions.openRenameSpaceFolder(folder)}>
        Rename
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        className="text-destructive"
        onSelect={() => actions.openDeleteSpaceFolder(folder)}
      >
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

interface NavRowProps {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  nested?: boolean;
}

function scheduledCount(tasks: Task[], offsetDays: number) {
  const range = localDayScheduleQuery(offsetDays);
  const from = Date.parse(range.scheduleFrom);
  const to = Date.parse(range.scheduleTo);
  return tasks.filter((task) => {
    const start = earliestActiveSlotStart(task);
    if (!start || task.parentTaskId != null) return false;
    if (
      task.status === TaskStatus.DONE ||
      task.status === TaskStatus.CANCELLED
    ) {
      return false;
    }
    const scheduled = Date.parse(start);
    return scheduled >= from && scheduled < to;
  }).length;
}
