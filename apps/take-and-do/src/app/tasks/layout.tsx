"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TasksSidebar } from "@/components/TasksSidebar/TasksSidebar";
import { CreateWorkspaceModal } from "@/components/TasksSidebar/Workspaces/CreateWorkspace/CreateWorkspaceModal";
import { PageContainer, Main } from "../page.styles";
import {
  buildScheduleUrl,
  buildBoardUrl,
  getActiveViewFromPathname,
} from "@/helpers/tasks-routing.helper";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { apiServices } from "@/services/api";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    setFolders,
    setTaskBoards,
  } = useWorkspaces();

  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [isWorkspaceCreateModalOpen, setIsWorkspaceCreateModalOpen] =
    useState(false);

  const activeView = getActiveViewFromPathname(pathname ?? "");

  const handleViewChange = (view: string) => {
    view === "today" || view === "tomorrow"
      ? router.push(buildScheduleUrl(view))
      : router.push(buildBoardUrl(view));
  };

  const handleNavigationChange = () => setIsNavSidebarOpen(true);

  const handleCreateFolder = async (name: string) => {
    try {
      const folder = await apiServices.folders.create(name);
      setFolders((prev) => [...prev, folder]);
      setIsWorkspaceCreateModalOpen(false);
    } catch (error) {
      console.error("[TasksLayout] Failed to create folder:", error);
      // TODO: Use notification toast
      alert("Failed to create folder.");
    }
  };

  const handleCreateTaskBoard = async (name: string) => {
    try {
      await apiServices.taskBoards.create({ name });
      setIsWorkspaceCreateModalOpen(false);
      router.push(buildBoardUrl(name));
      window.location.reload();
    } catch (error) {
      console.error("[TasksLayout] Failed to create task board:", error);
      // TODO: Use notification toast
      alert("Failed to create task board.");
    }
  };

  const workspaceValue = {
    folders,
    taskBoards,
    setFolders,
    setTaskBoards,
    isFoldersLoading,
    isBoardsLoading,
  };

  return (
    <WorkspaceProvider value={workspaceValue}>
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <TasksSidebar
          isOpen={isNavSidebarOpen}
          activeView={activeView}
          onViewChange={handleViewChange}
          onCreateTaskBoard={() => setIsWorkspaceCreateModalOpen(true)}
          folders={folders}
          taskBoards={taskBoards}
          setTaskBoards={setTaskBoards}
          setFolders={setFolders}
          isFoldersLoading={isFoldersLoading}
          isBoardsLoading={isBoardsLoading}
        />
        <Main $withNavSidebar={isNavSidebarOpen}>{children}</Main>

        {isWorkspaceCreateModalOpen && (
          <CreateWorkspaceModal
            onClose={() => setIsWorkspaceCreateModalOpen(false)}
            onCreateFolder={handleCreateFolder}
            onCreateBoard={handleCreateTaskBoard}
          />
        )}
      </PageContainer>
    </WorkspaceProvider>
  );
}
