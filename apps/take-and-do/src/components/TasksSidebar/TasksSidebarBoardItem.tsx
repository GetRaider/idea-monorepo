"use client";

import Image from "next/image";

import { DotsVerticalIcon } from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
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
    handleBoardDragStart,
    handleBoardReorderDragOver,
    handleBoardReorderDrop,
    setDragOverTarget,
  } = model;

  const isEditing = editingBoardId === taskBoard.id;
  const isMenuOpen = openMenuBoardId === taskBoard.id;
  const isSelected = activeView === taskBoard.name;

  return (
    <WorkspaceItem>
      <BoardRow
        isActive={isMenuOpen}
        isSelected={isSelected}
        data-selected={isSelected || undefined}
        onDragOver={handleBoardReorderDragOver}
        onDrop={(event) =>
          handleBoardReorderDrop(event, taskBoard, folderScope)
        }
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
            className="flex min-w-0 flex-1 items-center"
            draggable
            onDragStart={(event) => handleBoardDragStart(event, taskBoard)}
            onDragEnd={() => setDragOverTarget(null)}
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
