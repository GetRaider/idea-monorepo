"use client";

import Image from "next/image";

import { DotsVerticalIcon } from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import {
  sidebarBoardDraggableId,
  sidebarBoardInsertDroppableId,
  type SidebarBoardDraggableData,
  type SidebarBoardInsertDroppableData,
  useDraggable,
  useDroppable,
} from "@/lib/board-dnd";
import { TaskBoard } from "@/types/workspace";
import { EmojiPickerField } from "./EmojiPickerField";
import {
  WorkspaceItem,
  BoardRow,
  BoardToggle,
  BoardEditWrap,
  BoardEditInput,
  EmojiPreview,
  SidebarChevronGutter,
  WorkspaceRowActions,
} from "./TasksSidebar.ui";
import { SidebarTreeIconSlot } from "./SidebarTreeIconSlot";

import type { TasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";

type TasksSidebarBoardItemProps = {
  model: TasksSidebarModel;
  taskBoard: TaskBoard;
  folderScope: string | null;
};

export function TasksSidebarBoardItem({
  model,
  taskBoard,
  folderScope,
}: TasksSidebarBoardItemProps) {
  const {
    activeView,
    sidebarDragHighlight,
    editingBoardId,
    setEditingBoardId,
    editingName,
    setEditingName,
    editingBoardEmoji,
    setEditingBoardEmoji,
    openBoardEmojiPickerId,
    setOpenBoardEmojiPickerId,
    openMenuBoardId,
    setOpenMenuBoardId,
    handleViewChange,
    handleEditBoard,
    handleBoardAction,
  } = model;

  const isEditing = editingBoardId === taskBoard.id;
  const isMenuOpen = openMenuBoardId === taskBoard.id;
  const isSelected = activeView === taskBoard.name;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: sidebarBoardDraggableId(taskBoard.id),
    data: {
      type: "sidebar-board",
      boardId: taskBoard.id,
      folderId: taskBoard.folderId ?? null,
    } satisfies SidebarBoardDraggableData,
    disabled: isEditing,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: sidebarBoardInsertDroppableId(folderScope, taskBoard.id),
    data: {
      type: "sidebar-board-insert",
      folderScope,
      targetBoardId: taskBoard.id,
    } satisfies SidebarBoardInsertDroppableData,
  });

  const showDropSlot =
    sidebarDragHighlight?.kind === "before-board" &&
    sidebarDragHighlight.targetBoardId === taskBoard.id &&
    sidebarDragHighlight.folderScope === folderScope;

  const isNestedInFolder = folderScope != null;

  return (
    <WorkspaceItem>
      <BoardRow
        ref={setDropRef}
        isActive={isMenuOpen}
        isSelected={isSelected}
        isDropSlotActive={isNestedInFolder && showDropSlot}
        showDropInsertLine={!isNestedInFolder && showDropSlot}
        data-selected={isSelected || undefined}
        className={isDragging ? "opacity-0" : undefined}
      >
        {isEditing ? (
          <BoardEditWrap>
            <SidebarChevronGutter />
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <EmojiPickerField
                emoji={editingBoardEmoji}
                isOpen={openBoardEmojiPickerId === taskBoard.id}
                fallbackIconSrc="/kanban-board.svg"
                fallbackIconAlt="Task Board"
                onToggle={() =>
                  setOpenBoardEmojiPickerId((prev) =>
                    prev === taskBoard.id ? null : taskBoard.id,
                  )
                }
                onSelect={(emoji) => {
                  setEditingBoardEmoji(emoji);
                  void handleEditBoard(taskBoard, { emoji });
                }}
                onClear={() => {
                  setEditingBoardEmoji(null);
                  void handleEditBoard(taskBoard, { emoji: null });
                }}
              />
              <BoardEditInput
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditBoard(taskBoard);
                  if (e.key === "Escape") {
                    setEditingBoardId(null);
                    setOpenBoardEmojiPickerId(null);
                  }
                }}
                onBlur={(e) => {
                  const next = e.relatedTarget as HTMLElement | null;
                  if (
                    next?.closest("[data-emoji-picker-popover]") ||
                    next?.closest("[data-emoji-trigger]")
                  )
                    return;
                  handleEditBoard(taskBoard);
                }}
                autoFocus
                maxLength={30}
              />
            </span>
          </BoardEditWrap>
        ) : (
          <div
            ref={setDragRef}
            className="flex min-w-0 flex-1 items-center"
            {...listeners}
            {...attributes}
          >
            <BoardToggle
              onClick={() => {
                if (!isSelected) handleViewChange(taskBoard.name);
              }}
            >
              <SidebarChevronGutter />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <SidebarTreeIconSlot>
                  {taskBoard.emoji ? (
                    <EmojiPreview>{taskBoard.emoji}</EmojiPreview>
                  ) : (
                    <Image
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                      src="/kanban-board.svg"
                      alt="Task Board"
                    />
                  )}
                </SidebarTreeIconSlot>
                <span className="min-w-0 truncate leading-5">
                  {taskBoard.name}
                </span>
              </span>
            </BoardToggle>
          </div>
        )}
        {!isEditing && (
          <WorkspaceRowActions>
            <Dropdown
              options={[
                { label: "Edit", value: "edit" },
                { label: "Delete", value: "delete", danger: true },
              ]}
              onChange={(value) => handleBoardAction(taskBoard, value)}
              trigger={
                <span data-board-actions-trigger>
                  <DotsVerticalIcon size={14} />
                </span>
              }
              onOpenChange={(open) =>
                setOpenMenuBoardId(open ? taskBoard.id : null)
              }
            />
          </WorkspaceRowActions>
        )}
      </BoardRow>
    </WorkspaceItem>
  );
}
