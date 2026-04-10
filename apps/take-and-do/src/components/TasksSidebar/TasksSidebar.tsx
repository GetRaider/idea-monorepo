"use client";

import {
  useState,
  useCallback,
  useEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ChevronRightIcon,
  ClockCircleIcon,
  ClockNavIcon,
  DashboardIcon,
  DotsVerticalIcon,
  PlusIcon,
} from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import {
  TasksSidebarContainer,
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
  SidebarChevronGutter,
  WorkspaceContainer,
} from "./TasksSidebar.ui";
import { TasksSidebarResizeHandle } from "./TasksSidebarResizeHandle";

const DRAG_BOARD_KEY = "application/x-task-board-id";
const DRAG_REORDER_FOLDER_KEY = "application/x-tasks-sidebar-folder-reorder";
const DRAG_REORDER_BOARD_KEY = "application/x-tasks-sidebar-board-reorder";
const ROOT_DROP_ID = "__root__";
const isRootDrop = (id: string) => id === ROOT_DROP_ID;
import { Folder, TaskBoard } from "@/types/workspace";
import { toast } from "sonner";
import { clientServices } from "@/services";
import { ConfirmDialog } from "@/components/Dialogs";
import { Spinner } from "@/components/Spinner/Spinner";
import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { cn } from "@/lib/styles/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmojiPickerField } from "./EmojiPickerField";
import { useEmojiPickerState } from "./useEmojiPickerState";
import { useSidebarEditingState } from "./useSidebarEditingState";
import { useSidebarDeleteState } from "./useSidebarDeleteState";
import { useTasksSidebarOrder } from "@/hooks/tasks/useTasksSidebarOrder";

import { TasksSidebarTaskSearch } from "./TasksSidebarTaskSearch";

export function TasksSidebar({
  isOpen,
  widthPx,
  onWidthPxChange,
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

  const {
    sortedFolders,
    rootBoardsSorted,
    boardsInFolderSorted,
    reorderFolder,
    reorderRootBoard,
    reorderBoardInFolder,
  } = useTasksSidebarOrder(folders, taskBoards);

  useEffect(() => {
    const endDrag = () => setDragOverTarget(null);
    window.addEventListener("dragend", endDrag);
    return () => window.removeEventListener("dragend", endDrag);
  }, []);

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

      const updated = await clientServices.taskBoards.update({
        id: board.id,
        updates: {
          name: nameChanged ? trimmedName : board.name,
          emoji: emojiChanged ? desiredEmoji : board.emoji,
          folderId: board.folderId ?? null,
          isPublic: board.isPublic,
          createdAt: board.createdAt,
        },
      });
      if (!updated) {
        toast.error("Can't update board");
        return;
      }
      setTaskBoards((previous: TaskBoard[]) =>
        previous.map((item: TaskBoard) =>
          item.id === updated.id ? updated : item,
        ),
      );

      if (nameChanged) {
        router.push(tasksUrlHelper.routing.buildBoardUrl(updated.name));
      }
      toast.success(nameChanged ? "Board renamed" : "Board emoji updated");
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
    await clientServices.taskBoards.deleteBoard(id);
    const remaining = taskBoards.filter((board: TaskBoard) => board.id !== id);
    setTaskBoards(remaining);
    router.push(
      remaining.length > 0
        ? tasksUrlHelper.routing.buildBoardUrl(remaining[0].name)
        : tasksUrlHelper.routing.buildRootUrl(),
    );
    toast.success(`'${name}' board deleted`);
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

      const updated = await clientServices.folders.update({
        id: folder.id,
        updates: {
          name: nameChanged ? trimmedName : folder.name,
          emoji: emojiChanged ? desiredEmoji : folder.emoji,
          isPublic: folder.isPublic,
          createdAt: folder.createdAt,
        },
      });
      if (!updated) {
        toast.error("Can't update folder");
        return;
      }

      setFolders((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );

      toast.success(nameChanged ? "Folder renamed" : "Folder emoji updated");
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
    await clientServices.folders.deleteFolder(folder.id);
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    setTaskBoards((prev) =>
      prev.map((b) =>
        b.folderId === folder.id ? { ...b, folderId: undefined } : b,
      ),
    );
    toast.success("Folder deleted");
  };

  const handleBoardDragStart = (e: React.DragEvent, taskBoard: TaskBoard) => {
    if ((e.target as HTMLElement).closest("[data-board-actions-trigger]"))
      return;
    // Some browsers (notably Safari) won't start a drag without a text/plain payload.
    e.dataTransfer.setData("text/plain", taskBoard.id);
    e.dataTransfer.setData(DRAG_BOARD_KEY, taskBoard.id);
    e.dataTransfer.setData(
      DRAG_REORDER_BOARD_KEY,
      JSON.stringify({
        boardId: taskBoard.id,
        folderId: taskBoard.folderId ?? null,
      }),
    );
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
      if (!board) return;
      if ((board.folderId ?? null) === folderId) return;

      void clientServices.taskBoards
        .update({
          id: boardId,
          updates: {
            name: board.name,
            emoji: board.emoji,
            folderId,
            isPublic: board.isPublic,
            createdAt: board.createdAt,
          },
        })
        .then((updated) => {
          if (!updated) {
            toast.error("Can't move board");
            return;
          }
          setTaskBoards((previous) =>
            previous.map((item) => (item.id === updated.id ? updated : item)),
          );
          if (folderId && expandedFolder !== folderId)
            setExpandedFolder(folderId);
          toast.success("Board moved");
        });
    },
    [expandedFolder, setTaskBoards, taskBoards],
  );

  const handleBoardReorderDragOver = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes(DRAG_REORDER_BOARD_KEY)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
  };

  const handleBoardReorderDrop = (
    event: React.DragEvent,
    targetBoard: TaskBoard,
    folderScope: string | null,
  ) => {
    const raw = event.dataTransfer.getData(DRAG_REORDER_BOARD_KEY);
    if (!raw) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOverTarget(null);
    let payload: { boardId: string; folderId: string | null };
    try {
      payload = JSON.parse(raw) as { boardId: string; folderId: string | null };
    } catch {
      return;
    }
    const targetFolderId = targetBoard.folderId ?? null;
    if (payload.folderId !== targetFolderId) return;
    if (payload.boardId === targetBoard.id) return;
    if (folderScope === null) reorderRootBoard(payload.boardId, targetBoard.id);
    else reorderBoardInFolder(folderScope, payload.boardId, targetBoard.id);
  };

  const handleFolderReorderDragOver =
    (targetFolderId: string) => (event: React.DragEvent) => {
      if (!event.dataTransfer.types.includes(DRAG_REORDER_FOLDER_KEY)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      setDragOverTarget(targetFolderId);
    };

  const renderBoardItem = (
    taskBoard: TaskBoard,
    folderScope: string | null,
  ) => {
    const isEditing = editingBoardId === taskBoard.id;
    const isMenuOpen = openMenuBoardId === taskBoard.id;
    const isSelected = activeView === taskBoard.name;

    return (
      <WorkspaceItem key={taskBoard.id}>
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
  };

  return (
    <>
      <TasksSidebarContainer isOpen={isOpen} widthPx={widthPx}>
        <TasksSidebarTaskSearch taskBoards={taskBoards} />

        <WorkspaceContainer>
          <SideBarSectionHeader>Schedules</SideBarSectionHeader>

          <WorkspaceList className="min-h-0 flex-none">
            <WorkspaceItem>
              <WorkspaceToggle
                type="button"
                className={cn(
                  activeView === "today" &&
                    "cursor-default bg-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:text-white",
                )}
                onClick={() =>
                  activeView !== "today" && handleViewChange("today")
                }
              >
                <SidebarChevronGutter />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <SidebarTreeIconSlot>
                    <ClockNavIcon size={20} />
                  </SidebarTreeIconSlot>
                  <span className="min-w-0 truncate leading-5">Today</span>
                </span>
              </WorkspaceToggle>
            </WorkspaceItem>

            <WorkspaceItem>
              <WorkspaceToggle
                type="button"
                className={cn(
                  activeView === "tomorrow" &&
                    "cursor-default bg-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:text-white",
                )}
                onClick={() =>
                  activeView !== "tomorrow" && handleViewChange("tomorrow")
                }
              >
                <SidebarChevronGutter />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <SidebarTreeIconSlot>
                    <ClockCircleIcon size={20} />
                  </SidebarTreeIconSlot>
                  <span className="min-w-0 truncate leading-5">Tomorrow</span>
                </span>
              </WorkspaceToggle>
            </WorkspaceItem>
          </WorkspaceList>
        </WorkspaceContainer>

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
                          <FolderEditWrap onClick={(e) => e.stopPropagation()}>
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
                                  if (e.key === "Enter")
                                    handleEditFolder(folder);
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
                              event.dataTransfer.setData(
                                "text/plain",
                                folder.id,
                              );
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
                        {boardsInFolderSorted(folder.id).map((taskBoard) =>
                          renderBoardItem(taskBoard, folder.id),
                        )}
                      </SubItems>
                    ) : null}
                  </WorkspaceItem>
                ))}

                <RootBoardsDropZone>
                  {rootBoardsSorted.map((taskBoard) =>
                    renderBoardItem(taskBoard, null),
                  )}
                </RootBoardsDropZone>
              </>
            )}
          </WorkspaceList>
        </WorkspaceContainer>

        {isOpen ? (
          <TasksSidebarResizeHandle
            widthPx={widthPx}
            onWidthPxChange={onWidthPxChange}
          />
        ) : null}
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

function SidebarTreeIconSlot({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden text-current [&_img]:h-5 [&_img]:w-5 [&_img]:max-h-none [&_img]:max-w-none [&_img]:object-contain [&_svg]:block [&_svg]:h-5 [&_svg]:w-5 [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:shrink-0">
      {children}
    </span>
  );
}

interface TasksSidebarProps {
  isOpen: boolean;
  widthPx: number;
  onWidthPxChange: (width: number) => void;
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
