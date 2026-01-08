"use client";

import { useState, useEffect, use } from "react";
import { useRouter, notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import CreateTaskBoardModal from "@/components/NavigationSidebar/CreateTaskBoardModal";
import { SingleKanbanBoard } from "@/components/KanbanBoard/SingleKanbanBoard";
import TaskView from "@/components/TaskView/TaskView";
import { taskBoardsService } from "@/services/api/taskBoards.service";
import { foldersService } from "@/services/api/folders.service";
import { tasksService } from "@/services/api/tasks.service";
import { TaskBoard, Folder } from "@/types/workspace";
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
} from "../../../../utils/tasks-routing.utils";

interface BoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { boardPath } = use(params);
  const router = useRouter();

  const parsed = parseBoardPath(boardPath);
  if (!parsed) {
    notFound();
  }

  const { boardName, taskKey, subtaskKey } = parsed;

  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [boardExists, setBoardExists] = useState(true);

  // Task view state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  // Fetch boards and folders
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boards, foldersData] = await Promise.all([
          taskBoardsService.getAll(),
          foldersService.getAll(),
        ]);

        const nameMap: Record<string, string> = {};
        boards.forEach((board) => {
          nameMap[board.id] = board.name;
        });

        setTaskBoardNameMap(nameMap);
        setTaskBoards(boards);
        setFolders(foldersData);

        // Check if board exists
        const boardFound = boards.some((b) => b.name === boardName);
        setBoardExists(boardFound);

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsInitialized(true);
      }
    };

    fetchData();
  }, [boardName]);

  useEffect(() => {
    if (!taskKey || !isInitialized) return;

    const loadTask = async () => {
      setIsLoadingTask(true);
      try {
        if (subtaskKey) {
          const [parentResult, subtaskResult] = await Promise.all([
            tasksService.getByKey(taskKey),
            tasksService.getByKey(subtaskKey),
          ]);
          setParentTask(parentResult.task);
          setSelectedTask(subtaskResult.task);
        } else {
          const result = await tasksService.getByKey(taskKey);
          setSelectedTask(result.task);
          setParentTask(result.parent);
        }
      } catch (error) {
        console.error("Failed to load task:", error);
        router.push(buildBoardUrl(boardName));
      } finally {
        setIsLoadingTask(false);
      }
    };

    loadTask();
  }, [taskKey, subtaskKey, isInitialized, boardName, router]);

  const handleViewChange = (view: string) => {
    if (view === "today" || view === "tomorrow") {
      router.push(buildScheduleUrl(view));
    } else {
      // View is a board name
      router.push(buildBoardUrl(view));
    }
  };

  const handleNavigationChange = () => {
    setIsNavSidebarOpen(true);
  };

  const handleCreateTaskBoard = async (name: string) => {
    try {
      await taskBoardsService.create({ name });
      setIsCreateModalOpen(false);
      router.push(buildBoardUrl(name));
      window.location.reload();
    } catch (error) {
      console.error("Failed to create task board:", error);
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
      // Navigate to subtask URL
      router.push(
        buildBoardUrl(boardName, selectedTask.taskKey, subtask.taskKey),
      );
    }
  };

  const handleTaskDelete = () => {
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

  if (!isInitialized) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <NavigationSidebar
          isOpen={isNavSidebarOpen}
          activeView=""
          onViewChange={handleViewChange}
          onCreateTaskBoard={() => setIsCreateModalOpen(true)}
          taskBoards={[]}
          folders={[]}
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
        <NavigationSidebar
          isOpen={isNavSidebarOpen}
          activeView=""
          onViewChange={handleViewChange}
          onCreateTaskBoard={() => setIsCreateModalOpen(true)}
          taskBoards={taskBoards}
          folders={folders}
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
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView={boardName}
        onViewChange={handleViewChange}
        onCreateTaskBoard={() => setIsCreateModalOpen(true)}
        taskBoards={taskBoards}
        folders={folders}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <SingleKanbanBoard
          boardName={boardName}
          workspaceTitle={boardName}
          taskBoardNameMap={taskBoardNameMap}
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
