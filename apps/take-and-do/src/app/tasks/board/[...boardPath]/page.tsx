"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter, notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TasksSidebar } from "@/components/TasksSidebar/TasksSidebar";
import { CreateTaskBoardModal } from "@/components/TasksSidebar/CreateBoard/CreateTaskBoardModal";
import {
  SingleKanbanBoard,
  type SingleKanbanBoardRef,
} from "@/components/KanbanBoard/SingleKanbanBoard";
import { TaskView } from "@/components/TaskView/TaskView";
import { apiServices } from "@/services/api";
import { Task } from "@/components/KanbanBoard/types";
import { PageContainer, Main } from "../../../page.styles";
import {
  LoadingContainer,
  Spinner,
} from "@/components/KanbanBoard/KanbanBoard.styles";
import {
  parseBoardPath,
  buildScheduleUrl,
  buildBoardUrl,
} from "../../../../helpers/tasks-routing.helper";
import { useFolders } from "@/hooks/useFolders";
import { useBoards } from "@/hooks/useBoards";

interface BoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { boardPath } = use(params);
  const router = useRouter();

  const { folders, isLoading: isFoldersLoading, setFolders } = useFolders();
  const {
    boards: taskBoards,
    isLoading: isBoardsLoading,
    setBoards: setTaskBoards,
  } = useBoards();

  const parsedBoardPath = parseBoardPath(boardPath);
  if (!parsedBoardPath) notFound();

  useEffect(() => {
    if (!isBoardsLoading && !isFoldersLoading) {
      setIsReady(true);
    }
  }, [isBoardsLoading, isFoldersLoading]);

  const { boardName } = parsedBoardPath;

  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [boardExists, setBoardExists] = useState(true);
  const boardRef = useRef<SingleKanbanBoardRef>(null);

  // Task view state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  const handleViewChange = (view: string) => {
    view === "today" || view === "tomorrow"
      ? router.push(buildScheduleUrl(view))
      : router.push(buildBoardUrl(view));
  };

  const handleNavigationChange = () => {
    setIsNavSidebarOpen(true);
  };

  const handleCreateTaskBoard = async (name: string) => {
    try {
      await apiServices.taskBoards.create({ name });
      setIsCreateModalOpen(false);
      router.push(buildBoardUrl(name));
      window.location.reload();
    } catch (error) {
      console.error("Failed to create task board:", error);
      // TODO: Use notification toast instead of alert
      alert("Failed to create task board.");
    }
  };

  const handleCloseTaskView = () => {
    setSelectedTask(null);
    setParentTask(null);
    router.push(buildBoardUrl(boardName));
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setSelectedTask(updatedTask);
  };

  const handleSubtaskClick = (subtask: Task) => {
    if (selectedTask && selectedTask.taskKey && subtask.taskKey) {
      router.push(
        buildBoardUrl(boardName, selectedTask.taskKey, subtask.taskKey),
      );
    }
  };

  const handleTaskDelete = () => {
    boardRef.current?.refetch();
    router.push(buildBoardUrl(boardName));
  };

  // Update URL when a task is opened from the KanbanBoard
  const handleTaskOpen = (task: Task) => {
    if (task.taskKey) {
      const newUrl = buildBoardUrl(boardName, task.taskKey);
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Reset URL when task view is closed
  const handleTaskClose = () => {
    const newUrl = buildBoardUrl(boardName);
    window.history.replaceState(null, "", newUrl);
  };

  // Update URL when a subtask is opened
  const handleSubtaskOpen = (parentTask: Task, subtask: Task) => {
    if (parentTask.taskKey && subtask.taskKey) {
      const newUrl = buildBoardUrl(
        boardName,
        parentTask.taskKey,
        subtask.taskKey,
      );
      window.history.replaceState(null, "", newUrl);
    }
  };

  if (!isReady) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <TasksSidebar
          isOpen={isNavSidebarOpen}
          activeView=""
          onViewChange={handleViewChange}
          onCreateTaskBoard={() => setIsCreateModalOpen(true)}
          folders={folders}
          taskBoards={taskBoards}
          setTaskBoards={setTaskBoards}
          setFolders={setFolders}
          isFoldersLoading={isFoldersLoading}
          isBoardsLoading={isBoardsLoading}
        />
        <Main $withNavSidebar={isNavSidebarOpen}>
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        </Main>
      </PageContainer>
    );
  }

  if (!boardExists) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <TasksSidebar
          isOpen={isNavSidebarOpen}
          activeView=""
          onViewChange={handleViewChange}
          onCreateTaskBoard={() => setIsCreateModalOpen(true)}
          folders={folders}
          taskBoards={taskBoards}
          setTaskBoards={setTaskBoards}
          setFolders={setFolders}
          isFoldersLoading={isFoldersLoading}
          isBoardsLoading={isBoardsLoading}
        />
        <Main $withNavSidebar={isNavSidebarOpen}>
          <div style={{ padding: "40px", color: "#888" }}>
            Board &quot;{boardName}&quot; not found.
          </div>
        </Main>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <TasksSidebar
        isOpen={isNavSidebarOpen}
        activeView={boardName}
        onViewChange={handleViewChange}
        onCreateTaskBoard={() => setIsCreateModalOpen(true)}
        folders={folders}
        taskBoards={taskBoards}
        setFolders={setFolders}
        isFoldersLoading={isFoldersLoading}
        isBoardsLoading={isBoardsLoading}
        setTaskBoards={setTaskBoards}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <SingleKanbanBoard
          ref={boardRef}
          workspaceTitle={boardName}
          boardId={taskBoards.find((tb) => tb.name === boardName)?.id || ""}
          boardName={boardName}
          onTaskOpen={handleTaskOpen}
          onTaskClose={handleTaskClose}
          onSubtaskOpen={handleSubtaskOpen}
        />
      </Main>

      {!isLoadingTask && selectedTask && (
        <TaskView
          task={selectedTask}
          parentTask={parentTask}
          workspaceTitle={boardName}
          onClose={handleCloseTaskView}
          onTaskUpdate={handleTaskUpdate}
          onSubtaskClick={handleSubtaskClick}
          onTaskDelete={handleTaskDelete}
        />
      )}

      {isCreateModalOpen && (
        <CreateTaskBoardModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTaskBoard}
        />
      )}
    </PageContainer>
  );
}
