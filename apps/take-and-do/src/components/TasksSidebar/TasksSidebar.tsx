"use client";

import {
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ChevronRightIcon,
  ClockCircleIcon,
  ClockNavIcon,
  DotsVerticalIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import {
  TasksSidebarContainer,
  Search,
  SearchInput,
  NavItem,
  WorkspaceContainer,
  SideBarSectionHeader,
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  SubItems,
  AddButton,
  BoardRow,
  BoardToggle,
  BoardEditWrap,
  BoardEditInput,
  EmojiPreview,
  FolderDropTarget,
  FolderRow,
  FolderChevron,
  WorkspaceRowActions,
  FolderEditWrap,
  FolderEditInput,
  RootBoardsDropZone,
} from "./TasksSidebar.styles";

const DRAG_BOARD_KEY = "application/x-task-board-id";
const ROOT_DROP_ID = "__root__";
const isRootDrop = (id: string) => id === ROOT_DROP_ID;
import { Folder, TaskBoard } from "@/types/workspace";
import { toast } from "sonner";
import { apiServices } from "@/services/api";
import { ConfirmDialog } from "@/components/Dialogs";
import { LoadingContainer, Spinner } from "@/app/home/page.styles";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmojiPickerField } from "./EmojiPickerField";
import { useEmojiPickerState } from "./useEmojiPickerState";
import { useSidebarEditingState } from "./useSidebarEditingState";
import { useSidebarDeleteState } from "./useSidebarDeleteState";

interface TasksSidebarProps {
  isOpen: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onCreateTaskBoard?: () => void;
  folders: Folder[];
  taskBoards: TaskBoard[];
  setTaskBoards: Dispatch<SetStateAction<TaskBoard[]>>;
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
}

export function TasksSidebar({
  isOpen,
  activeView = "today",
  onViewChange,
  onCreateTaskBoard,
  folders,
  taskBoards,
  setTaskBoards,
  setFolders,
  isFoldersLoading,
  isBoardsLoading,
}: TasksSidebarProps) {
  const router = useRouter();
  const [expandedFolder, setExpandedFolder] = useState<string>("");
  const [openMenuBoardId, setOpenMenuBoardId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);
  const {
    editingBoardId,
    setEditingBoardId,
    editingName,
    setEditingName,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    startBoardEdit,
    startFolderEdit,
  } = useSidebarEditingState();
  const { deletingBoard, setDeletingBoard, deletingFolder, setDeletingFolder } =
    useSidebarDeleteState();
  const {
    editingBoardEmoji,
    setEditingBoardEmoji,
    openBoardEmojiPickerId,
    setOpenBoardEmojiPickerId,
    editingFolderEmoji,
    setEditingFolderEmoji,
    openFolderEmojiPickerId,
    setOpenFolderEmojiPickerId,
  } = useEmojiPickerState();

  const handleViewChange = (view: string) => onViewChange?.(view);

  const toggleFolder = (folderId: string) =>
    setExpandedFolder(expandedFolder === folderId ? "" : folderId);

  const handleEditStart = (board: TaskBoard) => {
    const boardEmoji = startBoardEdit(board);
    setEditingBoardEmoji(boardEmoji);
    setOpenBoardEmojiPickerId(null);
  };

  const handleEditBoard = useCallback(
    async (
      board: TaskBoard,
      opts?: {
        emoji?: string | null;
      },
    ) => {
      const trimmedName = editingName.trim();
      // `opts?.emoji === undefined` means "don't change emoji".
      // If it's `null`, that's a real "clear emoji" request.
      const desiredEmoji =
        opts?.emoji === undefined ? editingBoardEmoji : (opts?.emoji ?? null);

      const nameChanged = !!trimmedName && trimmedName !== (board.name ?? "");
      const emojiChanged = desiredEmoji !== (board.emoji ?? null);

      setEditingBoardId(null);
      setOpenBoardEmojiPickerId(null);

      if (!nameChanged && !emojiChanged) return;

      const updates: { name?: string; emoji?: string | null } = {};
      if (nameChanged) updates.name = trimmedName;
      if (emojiChanged) updates.emoji = desiredEmoji;

      try {
        const updated = await apiServices.taskBoards.update(board.id, updates);
        setTaskBoards((prev: TaskBoard[]) =>
          prev.map((b: TaskBoard) => (b.id === updated.id ? updated : b)),
        );

        if (nameChanged)
          router.push(tasksUrlHelper.routing.buildBoardUrl(updated.name));
        toast.success(nameChanged ? "Board renamed" : "Board emoji updated");
      } catch (error) {
        console.error("Failed to update task board:", error);
        toast.error("Failed to update board");
      }
    },
    [
      editingName,
      editingBoardEmoji,
      router,
      setEditingBoardId,
      setOpenBoardEmojiPickerId,
      setTaskBoards,
    ],
  );

  const handleDeleteConfirm = async () => {
    if (!deletingBoard) return;
    const { id, name } = deletingBoard;
    setDeletingBoard(null);
    try {
      await apiServices.taskBoards.deleteBoard(id);
      setTaskBoards((prev: TaskBoard[]) =>
        prev.filter((board: TaskBoard) => board.id !== id),
      );
      router.push(
        taskBoards.length > 0
          ? tasksUrlHelper.routing.buildBoardUrl(taskBoards[0].name)
          : tasksUrlHelper.routing.buildScheduleUrl("today"),
      );
      toast.success(`'${name}' board deleted`);
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast.error(`Failed to delete '${deletingBoard.name}' board`);
    }
  };

  const handleBoardAction = (taskBoard: TaskBoard, action: string) => {
    if (action === "edit") handleEditStart(taskBoard);
    if (action === "delete") setDeletingBoard(taskBoard);
  };

  const handleFolderEditStart = (folder: Folder) => {
    const folderEmoji = startFolderEdit(folder);
    setEditingFolderEmoji(folderEmoji);
    setOpenFolderEmojiPickerId(null);
  };

  const handleEditFolder = useCallback(
    async (
      folder: Folder,
      opts?: {
        emoji?: string | null;
      },
    ) => {
      const trimmedName = editingFolderName.trim();
      // `opts?.emoji === undefined` means "don't change emoji".
      // If it's `null`, that's a real "clear emoji" request.
      const desiredEmoji =
        opts?.emoji === undefined ? editingFolderEmoji : (opts?.emoji ?? null);

      const nameChanged = !!trimmedName && trimmedName !== (folder.name ?? "");
      const emojiChanged = desiredEmoji !== (folder.emoji ?? null);

      setEditingFolderId(null);
      setOpenFolderEmojiPickerId(null);

      if (!nameChanged && !emojiChanged) return;

      try {
        const updated = await apiServices.folders.update(folder.id, {
          ...(nameChanged ? { name: trimmedName } : {}),
          ...(emojiChanged ? { emoji: desiredEmoji } : {}),
        });

        setFolders((prev) =>
          prev.map((f) => (f.id === updated.id ? updated : f)),
        );

        toast.success(nameChanged ? "Folder renamed" : "Folder emoji updated");
      } catch (error) {
        console.error("Failed to update folder:", error);
        toast.error("Failed to update folder");
      }
    },
    [
      editingFolderEmoji,
      editingFolderName,
      setEditingFolderId,
      setOpenFolderEmojiPickerId,
      setFolders,
    ],
  );

  const handleFolderAction = (folder: Folder, action: string) => {
    if (action === "edit") handleFolderEditStart(folder);
    if (action === "delete") setDeletingFolder(folder);
  };

  const handleFolderDeleteConfirm = async () => {
    if (!deletingFolder) return;
    const folder = deletingFolder;
    setDeletingFolder(null);
    try {
      await apiServices.folders.deleteFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      setTaskBoards((prev) =>
        prev.map((b) =>
          b.folderId === folder.id ? { ...b, folderId: undefined } : b,
        ),
      );
      toast.success("Folder deleted");
    } catch (err) {
      console.error("Failed to delete folder:", err);
      toast.error("Failed to delete folder");
    }
  };

  const handleBoardDragStart = (e: React.DragEvent, boardId: string) => {
    if ((e.target as HTMLElement).closest("[data-board-actions-trigger]"))
      return;
    e.dataTransfer.setData(DRAG_BOARD_KEY, boardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOn = useCallback(
    (targetFolderId: string) => (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverTarget(null);
      const boardId = e.dataTransfer.getData(DRAG_BOARD_KEY);
      if (!boardId) return;
      const folderId = isRootDrop(targetFolderId) ? null : targetFolderId;
      const board = taskBoards.find((b) => b.id === boardId);
      if (board && (board.folderId ?? null) === folderId) return;
      apiServices.taskBoards
        .update(boardId, { folderId })
        .then((updated) => {
          setTaskBoards((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b)),
          );
          if (folderId && expandedFolder !== folderId)
            setExpandedFolder(folderId);
          toast.success("Board moved");
        })
        .catch((err) => {
          console.error("Failed to move board:", err);
          toast.error("Failed to move board");
        });
    },
    [expandedFolder, setTaskBoards, taskBoards],
  );

  const renderBoardItem = (taskBoard: TaskBoard) => {
    const isEditing = editingBoardId === taskBoard.id;
    const isMenuOpen = openMenuBoardId === taskBoard.id;
    const isSelected = activeView === taskBoard.name;

    return (
      <WorkspaceItem key={taskBoard.id}>
        <BoardRow
          $active={isMenuOpen}
          $selected={isSelected}
          data-selected={isSelected || undefined}
          draggable
          onDragStart={(e) => handleBoardDragStart(e, taskBoard.id)}
        >
          {isEditing ? (
            <BoardEditWrap>
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
                maxLength={64}
              />
            </BoardEditWrap>
          ) : (
            <BoardToggle
              onClick={() => {
                if (!isSelected) handleViewChange(taskBoard.name);
              }}
            >
              {taskBoard.emoji ? (
                <EmojiPreview>{taskBoard.emoji}</EmojiPreview>
              ) : (
                <Image
                  width={20}
                  height={20}
                  src="/kanban-board.svg"
                  alt="Task Board"
                />
              )}
              <span>{taskBoard.name}</span>
            </BoardToggle>
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
  };

  return (
    <>
      <TasksSidebarContainer $isOpen={isOpen}>
        <Search>
          <SearchIcon size={16} />
          <SearchInput type="text" placeholder="Search..." />
        </Search>

        <WorkspaceContainer>
          <SideBarSectionHeader>Schedules</SideBarSectionHeader>

          <NavItem
            $active={activeView === "today"}
            onClick={() => activeView !== "today" && handleViewChange("today")}
          >
            <ClockNavIcon size={20} />
            <span>Today</span>
          </NavItem>

          <NavItem
            $active={activeView === "tomorrow"}
            onClick={() =>
              activeView !== "tomorrow" && handleViewChange("tomorrow")
            }
          >
            <ClockCircleIcon size={20} />
            <span>Tomorrow</span>
          </NavItem>
        </WorkspaceContainer>

        <WorkspaceContainer $grow>
          <SideBarSectionHeader>
            <span>Workspaces</span>
            <AddButton
              onClick={() => onCreateTaskBoard?.()}
              title="Create Task Board"
            >
              <PlusIcon size={16} />
            </AddButton>
          </SideBarSectionHeader>

          {isFoldersLoading || isBoardsLoading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : (
            <WorkspaceList
              $isDragOver={dragOverTarget === ROOT_DROP_ID}
              onDragOver={(e) => {
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
              {folders.map((folder) => (
                <WorkspaceItem key={folder.id}>
                  <FolderDropTarget
                    $isDragOver={dragOverTarget === folder.id}
                    onDragOver={(e) => {
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
                      e.stopPropagation();
                      handleDropOn(folder.id)(e);
                    }}
                  >
                    <FolderRow $active={openMenuFolderId === folder.id}>
                      {editingFolderId === folder.id ? (
                        <FolderEditWrap onClick={(e) => e.stopPropagation()}>
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
                              void handleEditFolder(folder, { emoji: null });
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
                        </FolderEditWrap>
                      ) : (
                        <WorkspaceToggle
                          type="button"
                          aria-expanded={expandedFolder === folder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(folder.id);
                          }}
                        >
                          <FolderChevron
                            $expanded={expandedFolder === folder.id}
                            aria-hidden
                          >
                            <ChevronRightIcon size={14} />
                          </FolderChevron>
                          {folder.emoji ? (
                            <EmojiPreview>{folder.emoji}</EmojiPreview>
                          ) : (
                            <Image
                              width={20}
                              height={20}
                              src="/folder.svg"
                              alt="Folder"
                            />
                          )}
                          <span>{folder.name}</span>
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
                  {expandedFolder === folder.id && (
                    <SubItems>
                      {taskBoards
                        .filter((board) => board.folderId === folder.id)
                        .map((taskBoard) => renderBoardItem(taskBoard))}
                    </SubItems>
                  )}
                </WorkspaceItem>
              ))}

              <RootBoardsDropZone>
                {taskBoards.filter((tb) => !tb.folderId).map(renderBoardItem)}
              </RootBoardsDropZone>
            </WorkspaceList>
          )}
        </WorkspaceContainer>
      </TasksSidebarContainer>

      {deletingBoard && (
        <ConfirmDialog
          title={`Delete "${deletingBoard.name}" board?`}
          description="This will permanently delete the board and all its tasks. This action cannot be undone."
          confirmLabel="Delete board"
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingBoard(null)}
        />
      )}

      {deletingFolder && (
        <ConfirmDialog
          title={`Delete "${deletingFolder.name}" folder?`}
          description="The folder will be removed. Boards inside will move to the root. This action cannot be undone."
          confirmLabel="Delete folder"
          onConfirm={handleFolderDeleteConfirm}
          onClose={() => setDeletingFolder(null)}
        />
      )}
    </>
  );
}
