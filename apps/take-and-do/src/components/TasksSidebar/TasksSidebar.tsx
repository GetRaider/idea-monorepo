"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
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
  ChevronWrapper,
  SubItems,
  SubItem,
  AddButton,
  BoardRow,
  BoardToggle,
  BoardActionsWrapper,
  BoardNameInput,
} from "./TasksSidebar.styles";
import { Folder, TaskBoard } from "@/types/workspace";
import { apiServices } from "@/services/api";
import { DeleteBoardModal } from "./DeleteBoard/DeleteBoard";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useFolders } from "@/hooks/useFolders";
import { useBoards } from "@/hooks/useBoards";
import { LoadingContainer, Spinner } from "@/app/home/page.styles";
import EmojiPicker, { Categories } from "emoji-picker-react";

interface TasksSidebarProps {
  isOpen: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onCreateTaskBoard?: () => void;
  folders: Folder[];
  taskBoards: TaskBoard[];
  setTaskBoards: Dispatch<SetStateAction<TaskBoard[]>>;
  setFolders: (folders: Folder[]) => void;
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
  const [expandedFolder, setExpandedFolder] = useState<string>("");
  const [openMenuBoardId, setOpenMenuBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingBoard, setDeletingBoard] = useState<TaskBoard | null>(null);

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
        const updated = await apiServices.taskBoards.update(board.id, trimmed);
        setTaskBoards((prev: TaskBoard[]) =>
          prev.map((b: TaskBoard) => (b.id === updated.id ? updated : b)),
        );
      } catch (error) {
        console.error("Failed to rename task board:", error);
      }
    },
    [editingName],
  );

  const handleDeleteConfirm = async () => {
    if (!deletingBoard) return;
    const id = deletingBoard.id;
    setDeletingBoard(null);
    try {
      await apiServices.taskBoards.deleteBoard(id);
      setTaskBoards((prev: TaskBoard[]) =>
        prev.filter((b: TaskBoard) => b.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete task board:", error);
    }
  };

  const handleBoardAction = (taskBoard: TaskBoard, action: string) => {
    if (action === "edit") handleEditStart(taskBoard);
    if (action === "delete") setDeletingBoard(taskBoard);
  };

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
        >
          {isEditing ? (
            <BoardNameInput
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
            onClick={() => handleViewChange("today")}
          >
            <ClockNavIcon size={20} />
            <span>Today</span>
          </NavItem>

          <NavItem
            $active={activeView === "tomorrow"}
            onClick={() => handleViewChange("tomorrow")}
          >
            <ClockCircleIcon size={20} />
            <span>Tomorrow</span>
          </NavItem>
        </WorkspaceContainer>

        <WorkspaceContainer>
          <SideBarSectionHeader>
            <span>Boards</span>
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
            <WorkspaceList>
              {folders.map((folder) => (
                <WorkspaceItem key={folder.id}>
                  <WorkspaceToggle onClick={() => toggleFolder(folder.id)}>
                    <img
                      width={20}
                      height={20}
                      src="/folder.svg"
                      alt="Folder"
                    />
                    <span>{folder.name}</span>
                    <ChevronWrapper $expanded={expandedFolder === folder.id}>
                      <ChevronRightIcon size={16} />
                    </ChevronWrapper>
                  </WorkspaceToggle>
                  {expandedFolder === folder.id && (
                    <SubItems>
                      {taskBoards
                        .filter((board) => board.folderId === folder.id)
                        .map((taskBoard) => (
                          <SubItem
                            key={taskBoard.id}
                            onClick={() => handleViewChange(taskBoard.name)}
                          >
                            <img
                              width={20}
                              height={20}
                              src="/kanban-board.svg"
                              alt="Task Board"
                            />
                            {/* TODO: Add task board emoji */}
                            {/* <EmojiPicker /> */}
                            <span>{taskBoard.name}</span>
                          </SubItem>
                        ))}
                    </SubItems>
                  )}
                </WorkspaceItem>
              ))}

              {taskBoards.filter((tb) => !tb.folderId).map(renderBoardItem)}
            </WorkspaceList>
          )}
        </WorkspaceContainer>
      </TasksSidebarContainer>

      {deletingBoard && (
        <DeleteBoardModal
          onClose={() => setDeletingBoard(null)}
          onDelete={handleDeleteConfirm}
          boardName={deletingBoard.name}
        />
      )}
    </>
  );
}
