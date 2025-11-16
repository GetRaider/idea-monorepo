"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavigationSidebar from "@/components/NavigationSidebar/NavigationSidebar";
import { tasksService } from "@/services/api/tasks.service";
import { TaskStatus, TaskPriority, Task } from "@/components/KanbanBoard/types";
import {
  PageContainer,
  MainContent,
  WelcomeSection,
  Title,
  Subtitle,
  StatsGrid,
  StatCard,
  StatValue,
  StatLabel,
  StatIcon,
  Section,
  SectionTitle,
  TaskList,
  TaskItem,
  TaskSummary,
  TaskStatusBadge,
  CalendarSection,
  AISection,
  AICard,
  QuickActions,
  ActionButton,
  LoadingContainer,
  Spinner,
} from "./page.styles";

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allTasks, scheduledTasks] = await Promise.all([
          tasksService.getAll(),
          tasksService.getBySchedule("today"),
        ]);

        setTasks(allTasks);
        setTodayTasks(scheduledTasks.today);
        setTomorrowTasks(scheduledTasks.tomorrow);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page);
    if (page === "tasks") {
      setIsNavSidebarOpen(true);
    }
  };

  const handleViewChange = (view: string) => {
    // Navigate to tasks page when view changes
    if (view === "today" || view === "tomorrow") {
      window.location.href = "/tasks";
    }
  };

  // Calculate statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    highPriority: tasks.filter((t) => t.priority === TaskPriority.HIGH).length,
    overdue: tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== TaskStatus.DONE,
    ).length,
  };

  const recentTasks = tasks
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={handleNavigationChange} />
        <MainContent $withNavSidebar={isNavSidebarOpen}>
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar onNavigationChange={handleNavigationChange} />
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        activeView="today"
        onViewChange={handleViewChange}
      />
      <MainContent $withNavSidebar={isNavSidebarOpen}>
        <WelcomeSection>
          <Title>Welcome back!</Title>
          <Subtitle>Here's an overview of your workspace</Subtitle>
        </WelcomeSection>

        <StatsGrid>
          <StatCard>
            <StatIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </StatIcon>
            <StatValue>{taskStats.total}</StatValue>
            <StatLabel>Total Tasks</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </StatIcon>
            <StatValue>{taskStats.todo}</StatValue>
            <StatLabel>To Do</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </StatIcon>
            <StatValue>{taskStats.inProgress}</StatValue>
            <StatLabel>In Progress</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </StatIcon>
            <StatValue>{taskStats.done}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </StatIcon>
            <StatValue>{taskStats.highPriority}</StatValue>
            <StatLabel>High Priority</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 12h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </StatIcon>
            <StatValue>{taskStats.overdue}</StatValue>
            <StatLabel>Overdue</StatLabel>
          </StatCard>
        </StatsGrid>

        <Section>
          <SectionTitle>Today's Tasks</SectionTitle>
          {todayTasks.length > 0 ? (
            <TaskList>
              {todayTasks.slice(0, 5).map((task) => (
                <TaskItem key={task.id}>
                  <TaskSummary>
                    <strong>{task.summary}</strong>
                    <TaskStatusBadge $status={task.status}>
                      {task.status}
                    </TaskStatusBadge>
                  </TaskSummary>
                </TaskItem>
              ))}
            </TaskList>
          ) : (
            <p style={{ color: "#888", marginTop: "8px" }}>
              No tasks scheduled for today
            </p>
          )}
          <Link
            href="/tasks"
            style={{
              marginTop: "12px",
              display: "inline-block",
              color: "#667eea",
            }}
          >
            View all tasks →
          </Link>
        </Section>

        <Section>
          <SectionTitle>Calendar Events</SectionTitle>
          <CalendarSection>
            <p style={{ color: "#888" }}>Calendar integration coming soon...</p>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
              View and manage your upcoming events and deadlines
            </p>
          </CalendarSection>
        </Section>

        <Section>
          <SectionTitle>AI Analytics</SectionTitle>
          <AISection>
            <AICard>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                Productivity Insights
              </h3>
              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                You've completed {taskStats.done} tasks this week. Keep up the
                momentum!
              </p>
              <div
                style={{ color: "#667eea", fontSize: "14px", fontWeight: 500 }}
              >
                Completion rate:{" "}
                {taskStats.total > 0
                  ? Math.round((taskStats.done / taskStats.total) * 100)
                  : 0}
                %
              </div>
            </AICard>
            <AICard>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                Task Distribution
              </h3>
              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                Your tasks are well-distributed across different priorities and
                statuses.
              </p>
              <div
                style={{ color: "#667eea", fontSize: "14px", fontWeight: 500 }}
              >
                {taskStats.inProgress > 0
                  ? "Active work in progress"
                  : "All tasks are pending or completed"}
              </div>
            </AICard>
          </AISection>
        </Section>

        <QuickActions>
          <ActionButton href="/tasks">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" fill="currentColor" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                fill="currentColor"
              />
            </svg>
            Go to Tasks
          </ActionButton>
          <ActionButton
            href="/tasks"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                fill="currentColor"
              />
            </svg>
            Calendar (Coming Soon)
          </ActionButton>
        </QuickActions>
      </MainContent>
    </PageContainer>
  );
}
