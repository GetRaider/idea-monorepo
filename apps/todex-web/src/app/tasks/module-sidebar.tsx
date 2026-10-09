"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import type { Folder, TaskBoard } from "@repo/api/todex";

import {
  BoardIcon,
  CalendarIcon,
  ChevronIcon,
  ClockIcon,
  EllipsisIcon,
  FolderIcon,
  PlusIcon,
} from "@components/icons";
import { ResizeHandle } from "@components/resize-handle";
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

import { ModuleSidebarFrame, useModuleSidebar } from "@components/module-sidebar";

import { INBOX_BOARD_NAME } from "./task-helpers";
import { useTasks } from "./tasks-provider";
import { useSpaceDialogs } from "./space-dialogs";

export function TasksModuleSidebar() {
  const {
    state: { folders, boards, view },
    actions: { openCreateDialog, updateBoard },
  } = useTasks();
  const { open: isOpen } = useModuleSidebar();
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);
  const sensors = useSensors(
    useSensor(SpacePointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    setWidth(readTasksSidebarWidth());
  }, []);

  function handleSpaceDragEnd(event: DragEndEvent) {
    const drag = event.active.data.current;
    const drop = event.over?.data.current;
    if (!isSpaceDrag(drag) || !isSpaceDrop(drop)) return;
    const folderId = drop.kind === "folder" ? drop.folderId : null;
    if (drag.folderId === folderId) return;
    void updateBoard(drag.boardId, { folderId });
  }

  const activeBoardId = view.kind === "board" ? view.boardId : null;
  const inboxBoard = boards.find((board) => board.name === INBOX_BOARD_NAME);
  const rootBoards = boards.filter(
    (board) => !board.folderId && board.id !== inboxBoard?.id,
  );

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
          {inboxBoard ? (
            <NavRow
              href={tasksUrlHelper.routing.buildBoardUrl(inboxBoard.name)}
              active={activeBoardId === inboxBoard.id}
              icon={<BoardIcon size={16} />}
              label="Inbox"
            />
          ) : null}
          <NavRow
            href={tasksUrlHelper.routing.buildScheduleUrl("today")}
            active={view.kind === "schedule" && view.schedule === "today"}
            icon={<ClockIcon size={16} />}
            label="Today"
          />
          <NavRow
            href={tasksUrlHelper.routing.buildScheduleUrl("tomorrow")}
            active={view.kind === "schedule" && view.schedule === "tomorrow"}
            icon={<CalendarIcon size={16} />}
            label="Tomorrow"
          />
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
                  aria-label="Create board or folder"
                >
                  <PlusIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Create board or folder
              </TooltipContent>
            </Tooltip>
          </div>
          <DndContext
              sensors={sensors}
              collisionDetection={spaceCollisionDetection}
              onDragEnd={handleSpaceDragEnd}
            >
              <RootSpaceList
                boards={rootBoards.map((board) => (
                  <SpaceBoardRow
                    key={board.id}
                    boardId={board.id}
                    folderId={board.folderId}
                    href={tasksUrlHelper.routing.buildBoardUrl(board.name)}
                    active={activeBoardId === board.id}
                    icon={<BoardIcon size={16} />}
                    label={board.name}
                    menu={<BoardMenu board={board} />}
                  />
                ))}
              >
                {folders.map((folder) => (
                  <FolderGroup
                    key={folder.id}
                    folder={folder}
                    boards={boards.filter(
                      (board) => board.folderId === folder.id,
                    )}
                    activeBoardId={activeBoardId}
                  />
                ))}
              </RootSpaceList>
              <SpaceDragOverlay />
            </DndContext>
        </section>
      </div>
    </ModuleSidebarFrame>
  );
}

function FolderGroup({ folder, boards, activeBoardId }: FolderGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { setNodeRef, isOver } = useDroppable({
    id: `space-folder:${folder.id}`,
    data: { kind: "folder", folderId: folder.id } satisfies SpaceDropData,
  });
  const { active } = useDndContext();
  const drag = active?.data.current;
  const showDrop =
    isOver && isSpaceDrag(drag) && drag.folderId !== folder.id;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div ref={setNodeRef} className="relative rounded-lg">
        {showDrop ? <DropSlot /> : null}
        <div className="group relative my-1 flex items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-2 pr-8 text-left text-sm"
            >
              <ChevronIcon
                size={12}
                className={cn(
                  "shrink-0 transition-transform",
                  isExpanded && "rotate-90",
                )}
              />
              <FolderIcon size={16} />
              <span className="min-w-0 truncate">{folder.name}</span>
            </button>
          </CollapsibleTrigger>
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2">
            <FolderMenu folder={folder} />
          </div>
        </div>
        <CollapsibleContent>
          {boards.map((board) => (
            <SpaceBoardRow
              key={board.id}
              boardId={board.id}
              folderId={board.folderId}
              href={tasksUrlHelper.routing.buildBoardUrl(board.name)}
              active={activeBoardId === board.id}
              icon={<BoardIcon size={16} />}
              label={board.name}
              nested
              menu={<BoardMenu board={board} />}
            />
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function RootSpaceList({
  children,
  boards,
}: {
  children: ReactNode;
  boards: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "space-root",
    data: { kind: "root" } satisfies SpaceDropData,
  });
  const { active } = useDndContext();
  const drag = active?.data.current;
  const draggingFromFolder = isSpaceDrag(drag) && drag.folderId != null;

  return (
    <div ref={setNodeRef} className="relative flex min-h-0 flex-1 flex-col">
      {children}
      {draggingFromFolder ? (
        <div
          className={cn(
            "relative my-1 h-10 shrink-0 rounded-lg",
            isOver && "bg-surface/40",
          )}
        >
          <DropSlot />
        </div>
      ) : null}
      {boards}
    </div>
  );
}

function DropSlot() {
  return (
    <span className="pointer-events-none absolute inset-x-1 inset-y-1 z-10 rounded-lg border border-dotted border-muted-foreground/80" />
  );
}

function SpaceDragOverlay() {
  const { active } = useDndContext();
  const drag = active?.data.current;
  if (!isSpaceDrag(drag)) return null;
  return (
    <DragOverlay dropAnimation={null}>
      <div className="cursor-grabbing rounded-md border border-border bg-panel px-3 py-2 text-sm shadow-lg">
        {drag.label}
      </div>
    </DragOverlay>
  );
}

function SpaceBoardRow({
  boardId,
  folderId,
  ...row
}: NavRowProps & { boardId: string; folderId: string | null }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `space-board:${boardId}`,
    data: {
      kind: "board",
      boardId,
      folderId,
      label: row.label,
    } satisfies SpaceDragData,
  });

  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-0")}>
      <NavRow {...row} drag={{ attributes, listeners }} />
    </div>
  );
}

function NavRow({
  href,
  active,
  icon,
  label,
  nested = false,
  menu,
  drag,
}: NavRowProps) {
  const row = (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm",
        nested && "pl-8",
        menu && "pr-8",
        drag && "cursor-grab active:cursor-grabbing",
      )}
      draggable={drag ? false : undefined}
      {...drag?.listeners}
      {...drag?.attributes}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );

  return (
    <div
      className={cn(
        "group relative my-1 flex items-center rounded-lg",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {row}
      {menu ? (
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2">{menu}</div>
      ) : null}
    </div>
  );
}

function BoardMenu({ board }: { board: TaskBoard }) {
  const actions = useSpaceDialogs();
  return (
    <RowMenu>
      <DropdownMenuItem onSelect={() => actions.openRenameBoard(board)}>
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => actions.openMoveBoard(board)}>
        Move to folder
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onSelect={() => actions.openDeleteBoard(board)}
      >
        Delete
      </DropdownMenuItem>
    </RowMenu>
  );
}

function FolderMenu({ folder }: { folder: Folder }) {
  const actions = useSpaceDialogs();
  return (
    <RowMenu>
      <DropdownMenuItem onSelect={() => actions.openRenameFolder(folder)}>
        Rename
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onSelect={() => actions.openDeleteFolder(folder)}
      >
        Delete
      </DropdownMenuItem>
    </RowMenu>
  );
}

function RowMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="pointer-events-none h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100"
          aria-label="Space actions"
        >
          <EllipsisIcon size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function isSpaceDrag(value: unknown): value is SpaceDragData {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value) || value.kind !== "board") return false;
  if (!("boardId" in value) || typeof value.boardId !== "string") return false;
  if (!("folderId" in value)) return false;
  if (!("label" in value) || typeof value.label !== "string") return false;
  return value.folderId === null || typeof value.folderId === "string";
}

const spaceCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
  const folder = hits.find((hit) => String(hit.id).startsWith("space-folder:"));
  if (folder) return [folder];
  const root = hits.find((hit) => hit.id === "space-root");
  if (root) return [root];
  return hits[0] ? [hits[0]] : [];
};

function isSpaceDrop(value: unknown): value is SpaceDropData {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return false;
  }
  if (value.kind === "root") return true;
  return (
    value.kind === "folder" &&
    "folderId" in value &&
    typeof value.folderId === "string"
  );
}

class SpacePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false;
        const target = nativeEvent.target;
        if (
          target instanceof Element &&
          target.closest("button, input, textarea, select, [data-no-dnd]")
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}

interface FolderGroupProps {
  folder: Folder;
  boards: TaskBoard[];
  activeBoardId: string | null;
}

interface NavRowProps {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  nested?: boolean;
  menu?: ReactNode;
  drag?: {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners;
  };
}

interface SpaceDragData {
  kind: "board";
  boardId: string;
  folderId: string | null;
  label: string;
}

type SpaceDropData =
  | { kind: "folder"; folderId: string }
  | { kind: "root" };
