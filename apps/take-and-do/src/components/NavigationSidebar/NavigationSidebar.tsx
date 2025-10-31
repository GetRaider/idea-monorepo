"use client";

import { useState, useEffect } from "react";
import {
  NavigationSidebarContainer,
  Search,
  SearchInput,
  Nav,
  NavItem,
  Workspace,
  SideBarSectionHeader,
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  Chevron,
  SubItems,
  SubItem,
} from "./NavigationSidebar.styles";
import { Folder, TaskBoard } from "@/types/workspace";
import { foldersService } from "@/services/api/folders.service";
import { taskBoardsService } from "@/services/api/taskBoards.service";

interface NavigationSidebarProps {
  isOpen: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export default function NavigationSidebar({
  isOpen,
  activeView = "today",
  onViewChange,
}: NavigationSidebarProps) {
  const [expandedFolder, setExpandedFolder] = useState<string>("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foldersData, taskBoardsData] = await Promise.all([
          foldersService.getAll(),
          taskBoardsService.getAll(),
        ]);

        setFolders(foldersData);
        setTaskBoards(taskBoardsData);
      } catch (error) {
        console.error("Failed to fetch folders and task boards:", error);
      }
    };

    fetchData();
  }, []);

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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle
            cx="6.5"
            cy="6.5"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M10 10l4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <SearchInput type="text" placeholder="Search..." />
      </Search>

      <Nav>
        <SideBarSectionHeader>Schedules</SideBarSectionHeader>
        <NavItem
          $active={activeView === "today"}
          onClick={() => handleViewChange("today")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M10 6v4l3 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Today</span>
        </NavItem>

        <NavItem
          $active={activeView === "tomorrow"}
          onClick={() => handleViewChange("tomorrow")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <span>Tomorrow</span>
        </NavItem>
      </Nav>

      <Workspace>
        <SideBarSectionHeader>Workspace</SideBarSectionHeader>

        <WorkspaceList>
          {folders.map((folder) => (
            <WorkspaceItem key={folder.id}>
              <WorkspaceToggle onClick={() => toggleFolder(folder.id)}>
                <img width={20} height={20} src="/folder.svg" alt="Folder" />
                <span>{folder.name}</span>
                <Chevron
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  $expanded={expandedFolder === folder.id}
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Chevron>
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
      </Workspace>
    </NavigationSidebarContainer>
  );
}
