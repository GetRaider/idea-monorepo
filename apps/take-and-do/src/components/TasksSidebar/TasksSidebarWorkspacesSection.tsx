"use client";

import Image from "next/image";
import { Fragment, useCallback, useState } from "react";

import {
  ChevronRightIcon,
  DashboardIcon,
  DotsVerticalIcon,
  PlusIcon,
} from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { Spinner } from "@/components/Spinner/Spinner";
import { TASKS_ROOT_VIEW_ID } from "@/helpers/tasks-url.helper";
import {
  BOARD_AUTO_SCROLL,
  BOARD_DROP_MEASURING,
  DndContext,
  DragOverlay,
  sidebarCollisionDetection,
  sidebarRootDroppableId,
  type DragStartEvent,
  type SidebarDraggableData,
  type SidebarRootDroppableData,
  useBoardPointerSensors,
  useDroppable,
} from "@/lib/board-dnd";
import { cn } from "@/lib/styles/utils";

import {
  SideBarSectionHeader,
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  SubItems,
  AddButton,
  EmojiPreview,
  FolderRow,
  FolderChevron,
  WorkspaceRowActions,
  FolderEditWrap,
  FolderEditInput,
  SidebarChevronGutter,
  WorkspaceContainer,
} from "./TasksSidebar.ui";
import { TasksSidebarBoardItem } from "./TasksSidebarBoardItem";
import { EmojiPickerField } from "./EmojiPickerField";
import { SidebarTreeIconSlot } from "./SidebarTreeIconSlot";
import {
  SidebarFolderDragToggle,
  SidebarFolderDropTarget,
} from "./SidebarFolderDnd";
import {
  SidebarTopInsertEndZone,
  SidebarTopInsertZone,
} from "./SidebarTopInsertZone";

import type { TasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";
import type { Folder, TaskBoard } from "@/types/workspace";

type TasksSidebarWorkspacesSectionProps = {
  model: TasksSidebarModel;
  onCreateTaskBoard?: () => void;
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
};

type DragPreview =
  | { kind: "board"; board: TaskBoard }
  | { kind: "folder"; folder: Folder };

export function TasksSidebarWorkspacesSection({
  model,
  onCreateTaskBoard,
  isFoldersLoading,
  isBoardsLoading,
}: TasksSidebarWorkspacesSectionProps) {
  const sensors = useBoardPointerSensors();
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  const {
    activeView,
    sidebarDragHighlight,
    folders,
    taskBoards,
    openMenuFolderId,
    setOpenMenuFolderId,
    expandedFolder,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    editingFolderEmoji,
    setEditingFolderEmoji,
    openFolderEmojiPickerId,
    setOpenFolderEmojiPickerId,
    sortedTopLevelRows,
    boardsInFolderSorted,
    handleViewChange,
    toggleFolder,
    handleEditFolder,
    handleFolderAction,
    handleSidebarDragEnd,
    handleSidebarDragOver,
    handleSidebarDragCancel,
  } = model;

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as
        | SidebarDraggableData
        | undefined;
      if (data?.type === "sidebar-board") {
        const board = taskBoards.find((b) => b.id === data.boardId);
        if (board) setDragPreview({ kind: "board", board });
        return;
      }
      if (data?.type === "sidebar-folder") {
        const folder = folders.find((f) => f.id === data.folderId);
        if (folder) setDragPreview({ kind: "folder", folder });
      }
    },
    [folders, taskBoards],
  );

  const clearDragPreview = useCallback(() => setDragPreview(null), []);

  const { setNodeRef: setRootDropRef } = useDroppable({
    id: sidebarRootDroppableId(),
    data: { type: "sidebar-root" } satisfies SidebarRootDroppableData,
  });

  /** Full folder chrome: only when pointer is on the folder row target (move board into folder). */
  const folderRowDropHighlight = (folderId: string) =>
    sidebarDragHighlight?.kind === "folder" &&
    sidebarDragHighlight.folderId === folderId;

  const folderListDropHighlight = (folderId: string) =>
    sidebarDragHighlight?.kind === "before-board" &&
    sidebarDragHighlight.folderScope === folderId;

  return (
    <WorkspaceContainer grow>
      <SideBarSectionHeader>
        <span>Workspaces</span>
        <AddButton
          onClick={() => onCreateTaskBoard?.()}
          title="Create Task Board"
        >
          <PlusIcon size={16} />
        </AddButton>
      </SideBarSectionHeader>

      <DndContext
        sensors={sensors}
        collisionDetection={sidebarCollisionDetection}
        measuring={BOARD_DROP_MEASURING}
        autoScroll={BOARD_AUTO_SCROLL}
        onDragStart={handleDragStart}
        onDragOver={handleSidebarDragOver}
        onDragEnd={(e) => {
          clearDragPreview();
          handleSidebarDragEnd(e);
        }}
        onDragCancel={() => {
          clearDragPreview();
          handleSidebarDragCancel();
        }}
      >
        <WorkspaceList
          ref={setRootDropRef}
          isDragOver={sidebarDragHighlight?.kind === "root-surface"}
        >
          <WorkspaceItem>
            <WorkspaceToggle
              type="button"
              className={cn(
                activeView === TASKS_ROOT_VIEW_ID &&
                  "cursor-default bg-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:text-white",
              )}
              onClick={() =>
                activeView !== TASKS_ROOT_VIEW_ID &&
                handleViewChange(TASKS_ROOT_VIEW_ID)
              }
            >
              <SidebarChevronGutter />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <SidebarTreeIconSlot>
                  <DashboardIcon size={20} className="text-current" />
                </SidebarTreeIconSlot>
                <span className="min-w-0 truncate leading-5">Root</span>
              </span>
            </WorkspaceToggle>
          </WorkspaceItem>

          {isFoldersLoading || isBoardsLoading ? (
            <Spinner className="min-h-[280px] flex-1" />
          ) : (
            <>
              {sortedTopLevelRows.map((row) => (
                <Fragment key={row.id}>
                  <SidebarTopInsertZone
                    beforeId={row.id}
                    isActive={
                      sidebarDragHighlight?.kind === "top-insert" &&
                      sidebarDragHighlight.beforeId === row.id
                    }
                  />
                  {row.kind === "folder" ? (
                    <WorkspaceItem>
                      <SidebarFolderDropTarget
                        folderId={row.folder.id}
                        isDragOver={folderRowDropHighlight(row.folder.id)}
                      >
                        <FolderRow
                          isActive={openMenuFolderId === row.folder.id}
                        >
                          {editingFolderId === row.folder.id ? (
                            <FolderEditWrap
                              data-sidebar-inline-edit=""
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SidebarChevronGutter />
                              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                <EmojiPickerField
                                  emoji={editingFolderEmoji}
                                  isOpen={
                                    openFolderEmojiPickerId === row.folder.id
                                  }
                                  fallbackIconSrc="/folder.svg"
                                  fallbackIconAlt="Folder"
                                  onToggle={() =>
                                    setOpenFolderEmojiPickerId((prev) =>
                                      prev === row.folder.id
                                        ? null
                                        : row.folder.id,
                                    )
                                  }
                                  onSelect={(emoji) => {
                                    setEditingFolderEmoji(emoji);
                                    void handleEditFolder(row.folder, {
                                      emoji,
                                    });
                                  }}
                                  onClear={() => {
                                    setEditingFolderEmoji(null);
                                    void handleEditFolder(row.folder, {
                                      emoji: null,
                                    });
                                  }}
                                />
                                <FolderEditInput
                                  value={editingFolderName}
                                  onChange={(e) =>
                                    setEditingFolderName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleEditFolder(row.folder);
                                    if (e.key === "Escape") {
                                      setEditingFolderId(null);
                                      setOpenFolderEmojiPickerId(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const next =
                                      e.relatedTarget as HTMLElement | null;
                                    if (
                                      next?.closest(
                                        "[data-emoji-picker-popover]",
                                      ) ||
                                      next?.closest("[data-emoji-trigger]")
                                    )
                                      return;
                                    handleEditFolder(row.folder);
                                  }}
                                  autoFocus
                                  maxLength={64}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </span>
                            </FolderEditWrap>
                          ) : (
                            <SidebarFolderDragToggle
                              folder={row.folder}
                              editingFolderId={editingFolderId}
                              type="button"
                              className="min-w-0 flex-1"
                              aria-expanded={expandedFolder === row.folder.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(row.folder.id);
                              }}
                            >
                              <FolderChevron
                                isExpanded={expandedFolder === row.folder.id}
                                aria-hidden
                              >
                                <ChevronRightIcon size={11} />
                              </FolderChevron>
                              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                <SidebarTreeIconSlot>
                                  {row.folder.emoji ? (
                                    <EmojiPreview>
                                      {row.folder.emoji}
                                    </EmojiPreview>
                                  ) : (
                                    <Image
                                      width={20}
                                      height={20}
                                      className="h-5 w-5 object-contain"
                                      src="/folder.svg"
                                      alt="Folder"
                                    />
                                  )}
                                </SidebarTreeIconSlot>
                                <span className="min-w-0 truncate leading-5">
                                  {row.folder.name}
                                </span>
                              </span>
                            </SidebarFolderDragToggle>
                          )}
                          {editingFolderId !== row.folder.id && (
                            <WorkspaceRowActions>
                              <Dropdown
                                options={[
                                  { label: "Edit", value: "edit" },
                                  {
                                    label: "Delete",
                                    value: "delete",
                                    danger: true,
                                  },
                                ]}
                                onChange={(value) =>
                                  handleFolderAction(row.folder, value)
                                }
                                trigger={
                                  <span data-folder-actions-trigger>
                                    <DotsVerticalIcon size={14} />
                                  </span>
                                }
                                onOpenChange={(open) =>
                                  setOpenMenuFolderId(
                                    open ? row.folder.id : null,
                                  )
                                }
                              />
                            </WorkspaceRowActions>
                          )}
                        </FolderRow>
                        {expandedFolder === row.folder.id &&
                        boardsInFolderSorted(row.folder.id).length > 0 ? (
                          <SubItems
                            isDropActive={folderListDropHighlight(
                              row.folder.id,
                            )}
                          >
                            {boardsInFolderSorted(row.folder.id).map(
                              (taskBoard) => (
                                <TasksSidebarBoardItem
                                  key={taskBoard.id}
                                  model={model}
                                  taskBoard={taskBoard}
                                  folderScope={row.folder.id}
                                />
                              ),
                            )}
                          </SubItems>
                        ) : null}
                      </SidebarFolderDropTarget>
                    </WorkspaceItem>
                  ) : (
                    <WorkspaceItem>
                      <TasksSidebarBoardItem
                        model={model}
                        taskBoard={row.board}
                        folderScope={null}
                      />
                    </WorkspaceItem>
                  )}
                </Fragment>
              ))}
              <SidebarTopInsertEndZone
                isActive={
                  sidebarDragHighlight?.kind === "top-insert" &&
                  sidebarDragHighlight.beforeId === null
                }
              />
            </>
          )}
        </WorkspaceList>

        <DragOverlay dropAnimation={null}>
          {dragPreview?.kind === "board" ? (
            <div className="flex w-[min(100%,var(--sidebar-drag-w,260px))] min-w-[200px] cursor-grabbing items-center gap-2 rounded-xl border border-border-app bg-[#1f1f1f] px-3 py-2.5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <span className="text-lg leading-none">
                {dragPreview.board.emoji ?? "📋"}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {dragPreview.board.name}
              </span>
            </div>
          ) : dragPreview?.kind === "folder" ? (
            <div className="flex w-[min(100%,var(--sidebar-drag-w,260px))] min-w-[200px] cursor-grabbing items-center gap-2 rounded-xl border border-border-app bg-[#1f1f1f] px-3 py-2.5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <span className="text-lg leading-none">
                {dragPreview.folder.emoji ?? "📁"}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {dragPreview.folder.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </WorkspaceContainer>
  );
}
