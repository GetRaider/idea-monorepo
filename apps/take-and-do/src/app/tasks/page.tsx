"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import KanbanBoard, {
  TaskSchedule,
} from "@/components/KanbanBoard/KanbanBoard";
import CreateTaskBoardModal from "@/components/NavigationSidebar/CreateTaskBoardModal";
import { taskBoardsService } from "@/services/api/taskBoards.service";
import { foldersService } from "@/services/api/folders.service";
import { TaskBoard } from "@/types/workspace";
import { Folder } from "@/types/workspace";
import { PageContainer, Main } from "../page.styles";

export default function TasksPage() {
  const [, setCurrentPage] = useState("tasks");
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<TaskSchedule | string>(
    TaskSchedule.TODAY,
  );
  const [workspaceTitle, setWorkspaceTitle] = useState("Today");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boards, foldersData] = await Promise.all([
          taskBoardsService.getAll(),
          foldersService.getAll(),
        ]);
        const nameMap: Record<string, string> = {};
        boards.forEach((taskBoard) => {
          nameMap[taskBoard.id] = taskBoard.name;
        });
        setTaskBoardNameMap(nameMap);
        setTaskBoards(boards);
        setFolders(foldersData);
      } catch (error) {
        console.error("Failed to fetch task boards:", error);
      }
    };
    fetchData();
  }, []);

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page);
    setIsNavSidebarOpen(true);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);

    if (view === TaskSchedule.TODAY) {
      setWorkspaceTitle("Today");
    } else if (view === TaskSchedule.TOMORROW) {
      setWorkspaceTitle("Tomorrow");
    } else if (view) {
      setWorkspaceTitle(view);
    }
  };

  const handleCreateTaskBoard = async (name: string) => {
    try {
      await taskBoardsService.create({ name });
      setIsCreateModalOpen(false);
      // Refresh the page to show the new board
      window.location.reload();
    } catch (error) {
      console.error("Failed to create task board:", error);
      alert(
        "Failed to create task board. Please check the console for details.",
      );
    }
  };

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView={activeView}
        onViewChange={handleViewChange}
        onCreateTaskBoard={() => setIsCreateModalOpen(true)}
        taskBoards={taskBoards}
        folders={folders}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <KanbanBoard
          currentView={activeView}
          workspaceTitle={workspaceTitle}
          taskBoardNameMap={taskBoardNameMap}
        />
      </Main>

      {isCreateModalOpen && (
        <CreateTaskBoardModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTaskBoard}
        />
      )}
    </PageContainer>
  );
}
