"use client";

import Image from "next/image";

import {
  ChevronRightIcon,
  DashboardIcon,
  DotsVerticalIcon,
  PlusIcon,
} from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { Spinner } from "@/components/Spinner/Spinner";
import { TASKS_ROOT_VIEW_ID } from "@/helpers/tasks-url.helper";
import { cn } from "@/lib/styles/utils";

import {
  SideBarSectionHeader,
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  SubItems,
  AddButton,
  EmojiPreview,
  FolderDropTarget,
  FolderRow,
  FolderChevron,
  WorkspaceRowActions,
  FolderEditWrap,
  FolderEditInput,
  RootBoardsDropZone,
  SidebarChevronGutter,
  WorkspaceContainer,
} from "./TasksSidebar.ui";
import { TasksSidebarBoardItem } from "./TasksSidebarBoardItem";
import { EmojiPickerField } from "./EmojiPickerField";
import { SidebarTreeIconSlot } from "./SidebarTreeIconSlot";

import {
  DRAG_REORDER_FOLDER_KEY,
  ROOT_DROP_ID,
} from "../../constants/tasksSidebar.constants";
import type { TasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";

type TasksSidebarWorkspacesSectionProps = {
  model: TasksSidebarModel;
  onCreateTaskBoard?: () => void;
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
};

export function TasksSidebarWorkspacesSection({
  model,
  onCreateTaskBoard,
  isFoldersLoading,
  isBoardsLoading,
}: TasksSidebarWorkspacesSectionProps) {
  const {
    activeView,
    dragOverTarget,
    setDragOverTarget,
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
    sortedFolders,
    boardsInFolderSorted,
    rootBoardsSorted,
    reorderFolder,
    handleViewChange,
    toggleFolder,
    handleEditFolder,
    handleFolderAction,
    handleDropOn,
    handleFolderReorderDragOver,
  } = model;

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

      <WorkspaceList
        isDragOver={dragOverTarget === ROOT_DROP_ID}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(DRAG_REORDER_FOLDER_KEY)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOverTarget(ROOT_DROP_ID);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setDragOverTarget(null);
        }}
        onDrop={handleDropOn(ROOT_DROP_ID)}
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
            {sortedFolders.map((folder) => (
              <WorkspaceItem key={folder.id}>
                <FolderDropTarget
                  isDragOver={dragOverTarget === folder.id}
                  onDragOver={(e) => {
                    if (
                      e.dataTransfer.types.includes(DRAG_REORDER_FOLDER_KEY)
                    ) {
                      handleFolderReorderDragOver(folder.id)(e);
                      return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverTarget(folder.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      setDragOverTarget(null);
                  }}
                  onDrop={(e) => {
                    const reorderDragged = e.dataTransfer.getData(
                      DRAG_REORDER_FOLDER_KEY,
                    );
                    if (reorderDragged && reorderDragged !== folder.id) {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverTarget(null);
                      reorderFolder(reorderDragged, folder.id);
                      return;
                    }
                    e.stopPropagation();
                    handleDropOn(folder.id)(e);
                  }}
                >
                  <FolderRow isActive={openMenuFolderId === folder.id}>
                    {editingFolderId === folder.id ? (
                      <FolderEditWrap
                        data-sidebar-inline-edit=""
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SidebarChevronGutter />
                        <span className="flex min-w-0 flex-1 items-center gap-1.5">
                          <EmojiPickerField
                            emoji={editingFolderEmoji}
                            isOpen={openFolderEmojiPickerId === folder.id}
                            fallbackIconSrc="/folder.svg"
                            fallbackIconAlt="Folder"
                            onToggle={() =>
                              setOpenFolderEmojiPickerId((prev) =>
                                prev === folder.id ? null : folder.id,
                              )
                            }
                            onSelect={(emoji) => {
                              setEditingFolderEmoji(emoji);
                              void handleEditFolder(folder, { emoji });
                            }}
                            onClear={() => {
                              setEditingFolderEmoji(null);
                              void handleEditFolder(folder, {
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
                              if (e.key === "Enter") handleEditFolder(folder);
                              if (e.key === "Escape") {
                                setEditingFolderId(null);
                                setOpenFolderEmojiPickerId(null);
                              }
                            }}
                            onBlur={(e) => {
                              const next =
                                e.relatedTarget as HTMLElement | null;
                              if (
                                next?.closest("[data-emoji-picker-popover]") ||
                                next?.closest("[data-emoji-trigger]")
                              )
                                return;
                              handleEditFolder(folder);
                            }}
                            autoFocus
                            maxLength={64}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </span>
                      </FolderEditWrap>
                    ) : (
                      <WorkspaceToggle
                        type="button"
                        className="min-w-0 flex-1"
                        draggable
                        aria-expanded={expandedFolder === folder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFolder(folder.id);
                        }}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          // Some browsers won't initiate drag without text/plain.
                          event.dataTransfer.setData("text/plain", folder.id);
                          event.dataTransfer.setData(
                            DRAG_REORDER_FOLDER_KEY,
                            folder.id,
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDragOverTarget(null)}
                      >
                        <FolderChevron
                          isExpanded={expandedFolder === folder.id}
                          aria-hidden
                        >
                          <ChevronRightIcon size={11} />
                        </FolderChevron>
                        <span className="flex min-w-0 flex-1 items-center gap-1.5">
                          <SidebarTreeIconSlot>
                            {folder.emoji ? (
                              <EmojiPreview>{folder.emoji}</EmojiPreview>
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
                            {folder.name}
                          </span>
                        </span>
                      </WorkspaceToggle>
                    )}
                    {editingFolderId !== folder.id && (
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
                            handleFolderAction(folder, value)
                          }
                          trigger={
                            <span data-folder-actions-trigger>
                              <DotsVerticalIcon size={14} />
                            </span>
                          }
                          onOpenChange={(open) =>
                            setOpenMenuFolderId(open ? folder.id : null)
                          }
                        />
                      </WorkspaceRowActions>
                    )}
                  </FolderRow>
                </FolderDropTarget>
                {expandedFolder === folder.id &&
                boardsInFolderSorted(folder.id).length > 0 ? (
                  <SubItems>
                    {boardsInFolderSorted(folder.id).map((taskBoard) => (
                      <TasksSidebarBoardItem
                        key={taskBoard.id}
                        model={model}
                        taskBoard={taskBoard}
                        folderScope={folder.id}
                      />
                    ))}
                  </SubItems>
                ) : null}
              </WorkspaceItem>
            ))}

            <RootBoardsDropZone>
              {rootBoardsSorted.map((taskBoard) => (
                <TasksSidebarBoardItem
                  key={taskBoard.id}
                  model={model}
                  taskBoard={taskBoard}
                  folderScope={null}
                />
              ))}
            </RootBoardsDropZone>
          </>
        )}
      </WorkspaceList>
    </WorkspaceContainer>
  );
}
