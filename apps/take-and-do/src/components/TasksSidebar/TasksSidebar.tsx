"use client";

import {
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
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
  BoardActionsWrapper,
  BoardEditWrap,
  BoardEditInput,
  FolderDropTarget,
  FolderRow,
  FolderActionsWrapper,
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
import {
  buildBoardUrl,
  buildScheduleUrl,
} from "@/helpers/tasks-routing.helper";
import { useRouter } from "next/navigation";

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
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingBoard, setDeletingBoard] = useState<TaskBoard | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const handleViewChange = (view: string) => onViewChange?.(view);

  const toggleFolder = (folderId: string) =>
    setExpandedFolder(expandedFolder === folderId ? "" : folderId);

  const handleEditStart = (board: TaskBoard) => {
    setEditingName(board.name);
    setEditingBoardId(board.id);
  };

  const handleEditBoard = useCallback(
    async (board: TaskBoard) => {
      const trimmed = editingName.trim();
      setEditingBoardId(null);
      if (!trimmed || trimmed === board.name) return;

      try {
        const updated = await apiServices.taskBoards.update(board.id, {
          name: trimmed,
        });
        setTaskBoards((prev: TaskBoard[]) =>
          prev.map((b: TaskBoard) => (b.id === updated.id ? updated : b)),
        );
        router.push(buildBoardUrl(updated.name));
        toast.success("Board renamed");
      } catch (error) {
        console.error("Failed to rename task board:", error);
        toast.error("Failed to rename board");
      }
    },
    [editingName],
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
          ? buildBoardUrl(taskBoards[0].name)
          : buildScheduleUrl("today"),
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
    setEditingFolderName(folder.name);
    setEditingFolderId(folder.id);
  };

  const handleEditFolder = useCallback(
    async (folder: Folder) => {
      const trimmed = editingFolderName.trim();
      setEditingFolderId(null);
      if (!trimmed || trimmed === folder.name) return;
      try {
        const updated = await apiServices.folders.update(folder.id, trimmed);
        setFolders((prev) =>
          prev.map((f) => (f.id === updated.id ? updated : f)),
        );
        toast.success("Folder renamed");
      } catch (error) {
        console.error("Failed to rename folder:", error);
        toast.error("Failed to rename folder");
      }
    },
    [editingFolderName, setFolders],
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
              <img
                width={20}
                height={20}
                src="/kanban-board.svg"
                alt="Task Board"
              />
              <BoardEditInput
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditBoard(taskBoard);
                  if (e.key === "Escape") setEditingBoardId(null);
                }}
                onBlur={() => handleEditBoard(taskBoard)}
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
              <img
                width={20}
                height={20}
                src="/kanban-board.svg"
                alt="Task Board"
              />
              <span>{taskBoard.name}</span>
            </BoardToggle>
          )}
          {!isEditing && (
            <BoardActionsWrapper>
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
            </BoardActionsWrapper>
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
                          <img
                            width={20}
                            height={20}
                            src="/folder.svg"
                            alt="Folder"
                          />
                          <FolderEditInput
                            value={editingFolderName}
                            onChange={(e) =>
                              setEditingFolderName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditFolder(folder);
                              if (e.key === "Escape") setEditingFolderId(null);
                            }}
                            onBlur={() => handleEditFolder(folder)}
                            autoFocus
                            maxLength={64}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </FolderEditWrap>
                      ) : (
                        <WorkspaceToggle
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(folder.id);
                          }}
                        >
                          <img
                            width={20}
                            height={20}
                            src="/folder.svg"
                            alt="Folder"
                          />
                          <span>{folder.name}</span>
                        </WorkspaceToggle>
                      )}
                      {editingFolderId !== folder.id && (
                        <FolderActionsWrapper>
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
                        </FolderActionsWrapper>
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
