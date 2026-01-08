"use client";

import { useState, useEffect, use } from "react";
import { notFound, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import CreateTaskBoardModal from "@/components/NavigationSidebar/CreateTaskBoardModal";
import { MultipleKanbanBoard } from "@/components/KanbanBoard/MultipleKanbanBoard";
import { taskBoardsService } from "@/services/api/taskBoards.service";
import { foldersService } from "@/services/api/folders.service";
import { TaskBoard, Folder } from "@/types/workspace";
import { Task } from "@/components/KanbanBoard/types";
import { PageContainer, Main } from "../../../page.styles";
import {
  LoadingContainer,
  Spinner,
} from "@/components/KanbanBoard/KanbanBoard.styles";
import {
  isValidScheduleDate,
  buildScheduleUrl,
  buildBoardUrl,
  ScheduleDate,
} from "../../../../utils/tasks-routing.utils";

interface SchedulePageProps {
  params: Promise<{ date: string }>;
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { date } = use(params);
  const router = useRouter();
  const availableDates: ScheduleDate[] = ["today", "tomorrow"];

  // Validate date param
  if (!isValidScheduleDate(date)) {
    notFound();
  }

  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

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
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsInitialized(true);
      }
    };

    fetchData();
  }, []);

  const handleViewChange = (view: ScheduleDate) => {
    availableDates.includes(view)
      ? router.push(buildScheduleUrl(view))
      : router.push(buildBoardUrl(view));
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

  const handleTaskOpen = (task: Task) => {
    if (task.taskKey) {
      const newUrl = `/tasks/schedule/${date}/${task.taskKey}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const handleTaskClose = () => {
    const newUrl = buildScheduleUrl(date);
    window.history.replaceState(null, "", newUrl);
  };

  const handleSubtaskOpen = (parentTask: Task, subtask: Task) => {
    if (parentTask.taskKey && subtask.taskKey) {
      const newUrl = `/tasks/schedule/${date}/${parentTask.taskKey}/${subtask.taskKey}`;
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
          onViewChange={(view: string) =>
            handleViewChange(view as ScheduleDate)
          }
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

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView={date}
        onViewChange={(view: string) => handleViewChange(view as ScheduleDate)}
        onCreateTaskBoard={() => setIsCreateModalOpen(true)}
        taskBoards={taskBoards}
        folders={folders}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <MultipleKanbanBoard
          scheduleDate={getScheduleDate(date)}
          workspaceTitle={getWorkspaceTitle(date)}
          taskBoardNameMap={taskBoardNameMap}
          onTaskOpen={handleTaskOpen}
          onTaskClose={handleTaskClose}
          onSubtaskOpen={handleSubtaskOpen}
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

function getScheduleDate(date: ScheduleDate): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (date === "tomorrow") {
    now.setDate(now.getDate() + 1);
  }
  return now;
}

function getWorkspaceTitle(date: ScheduleDate): string {
  return date === "today" ? "Today" : "Tomorrow";
}
