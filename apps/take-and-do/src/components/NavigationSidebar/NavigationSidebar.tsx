"use client";

import { useState, useEffect } from "react";
import {
  ChevronRightIcon,
  ClockCircleIcon,
  ClockNavIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/Icons";
import {
  NavigationSidebarContainer,
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
} from "./NavigationSidebar.styles";
import { Folder, TaskBoard } from "@/types/workspace";
import { apiServices } from "@/services/api";

interface NavigationSidebarProps {
  isOpen: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onCreateTaskBoard?: () => void;
  taskBoards?: TaskBoard[];
  folders?: Folder[];
}

export default function NavigationSidebar({
  isOpen,
  activeView = "today",
  onViewChange,
  onCreateTaskBoard,
  taskBoards: providedTaskBoards,
  folders: providedFolders,
}: NavigationSidebarProps) {
  const [expandedFolder, setExpandedFolder] = useState<string>("");
  const [folders, setFolders] = useState<Folder[]>(providedFolders || []);
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>(
    providedTaskBoards || [],
  );

  useEffect(() => {
    // Only fetch if not provided as props
    if (providedFolders && providedTaskBoards) {
      setFolders(providedFolders);
      setTaskBoards(providedTaskBoards);
      return;
    }

    const fetchData = async () => {
      try {
        const [foldersData, taskBoardsData] = await Promise.all([
          apiServices.folders.getAll(),
          apiServices.taskBoards.getAll(),
        ]);

        setFolders(foldersData);
        setTaskBoards(taskBoardsData);
      } catch (error) {
        console.error("Failed to fetch folders and task boards:", error);
      }
    };

    fetchData();
  }, [providedFolders, providedTaskBoards]);

  const handleViewChange = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolder(expandedFolder === folderId ? "" : folderId);
  };

  return (
    <NavigationSidebarContainer $isOpen={isOpen}>
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
          <span>Spaces</span>
          <AddButton
            onClick={() => onCreateTaskBoard?.()}
            title="Create Task Board"
          >
            <PlusIcon size={16} />
          </AddButton>
        </SideBarSectionHeader>

        <WorkspaceList>
          {folders.map((folder) => (
            <WorkspaceItem key={folder.id}>
              <WorkspaceToggle onClick={() => toggleFolder(folder.id)}>
                <img width={20} height={20} src="/folder.svg" alt="Folder" />
                <span>{folder.name}</span>
                <ChevronWrapper $expanded={expandedFolder === folder.id}>
                  <ChevronRightIcon size={16} />
                </ChevronWrapper>
              </WorkspaceToggle>
              {expandedFolder === folder.id && (
                <SubItems>
                  {taskBoards
                    .filter((tb) => tb.folderId === folder.id)
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
                        <span>{taskBoard.name}</span>
                      </SubItem>
                    ))}
                </SubItems>
              )}
            </WorkspaceItem>
          ))}

          {taskBoards
            .filter((tb) => !tb.folderId)
            .map((taskBoard) => (
              <WorkspaceItem key={taskBoard.id}>
                <WorkspaceToggle
                  onClick={() => handleViewChange(taskBoard.name)}
                >
                  <img
                    width={20}
                    height={20}
                    src="/kanban-board.svg"
                    alt="Task Board"
                  />
                  <span>{taskBoard.name}</span>
                </WorkspaceToggle>
              </WorkspaceItem>
            ))}
        </WorkspaceList>
      </WorkspaceContainer>
    </NavigationSidebarContainer>
  );
}
