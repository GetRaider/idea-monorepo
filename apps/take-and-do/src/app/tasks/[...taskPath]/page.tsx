"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import KanbanBoard, {
  TaskSchedule,
} from "@/components/KanbanBoard/KanbanBoard";
import TaskView from "@/components/TaskView/TaskView";
import { PageContainer, Main } from "../../page.styles";
import { Task } from "@/components/KanbanBoard/types";
import { tasksService } from "@/services/api/tasks.service";

interface TaskPageProps {
  params: Promise<{ taskPath: string[] }>;
}

export default function TaskPage({ params }: TaskPageProps) {
  const { taskPath } = use(params);
  const router = useRouter();
  
  // Parse route: /tasks/[taskKey] or /tasks/[taskKey]/[subtaskKey]
  const taskKey = taskPath[0];
  const subtaskKey = taskPath[1];
  
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<TaskSchedule | string>(TaskSchedule.TODAY);
  const [workspaceTitle, setWorkspaceTitle] = useState("Today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      try {
        if (subtaskKey) {
          // Loading a subtask: fetch both parent and subtask
          const [parentResult, subtaskResult] = await Promise.all([
            tasksService.getByKey(taskKey),
            tasksService.getByKey(subtaskKey),
          ]);
          setParentTask(parentResult.task);
          setSelectedTask(subtaskResult.task);
        } else {
          // Loading a main task
          const result = await tasksService.getByKey(taskKey);
          setSelectedTask(result.task);
          setParentTask(result.parent);
        }
      } catch (error) {
        console.error("Failed to load task:", error);
        router.push("/tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskKey, subtaskKey, router]);

  const handleNavigationChange = () => {
    setIsNavSidebarOpen(true);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === TaskSchedule.TODAY) {
      setWorkspaceTitle("Today");
    } else if (view === TaskSchedule.TOMORROW) {
      setWorkspaceTitle("Tomorrow");
    } else {
      setWorkspaceTitle(view);
    }
  };

  const handleCloseTaskView = () => {
    setSelectedTask(null);
    setParentTask(null);
    router.push("/tasks");
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setSelectedTask(updatedTask);
  };

  const handleSubtaskClick = (subtask: Task) => {
    if (selectedTask) {
      setParentTask(selectedTask);
      setSelectedTask(subtask);
    }
  };

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView={activeView}
        onViewChange={handleViewChange}
      />
      <Main $withNavSidebar={isNavSidebarOpen}>
        <KanbanBoard currentView={activeView} workspaceTitle={workspaceTitle} />
      </Main>

      {!isLoading && selectedTask && (
        <TaskView
          task={selectedTask}
          parentTask={parentTask}
          workspaceTitle={workspaceTitle}
          onClose={handleCloseTaskView}
          onTaskUpdate={handleTaskUpdate}
          onSubtaskClick={handleSubtaskClick}
        />
      )}
    </PageContainer>
  );
}

