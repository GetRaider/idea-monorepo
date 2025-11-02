"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BoardContainer,
  Board,
  WorkspaceSeparator,
  LoadingContainer,
  Spinner,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";
import { Chevron } from "../NavigationSidebar/NavigationSidebar.styles";
import { Toolbar } from "./shared/Toolbar";
import { TaskStatus, TaskSchedule, TaskGroup } from "./types";
import {
  fetchTaskBoardNameMap,
  loadScheduledContent,
  loadFolderContent,
} from "./shared/dataLoaders";
import { handleMultipleBoardsTaskStatusChange } from "./shared/taskStatusHandlers";

interface MultipleKanbanBoardProps {
  schedule?: TaskSchedule;
  workspaceTitle: string;
  folderId?: string;
}

export function MultipleKanbanBoard({
  schedule,
  workspaceTitle,
  folderId,
}: MultipleKanbanBoardProps) {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const taskBoardNamesMap = await fetchTaskBoardNameMap();
        setTaskBoardNameMap(taskBoardNamesMap);

        let loadedGroups: TaskGroup[] = [];
        if (schedule) {
          await loadScheduledContent({
            schedule,
            taskBoardNamesMap,
            setTaskGroups: (groups) => {
              loadedGroups = groups;
              setTaskGroups(groups);
            },
          });
        } else if (folderId) {
          await loadFolderContent({
            folderId,
            taskBoardNamesMap,
            setTaskGroups: (groups) => {
              loadedGroups = groups;
              setTaskGroups(groups);
            },
          });
        }

        // Expand all groups by default
        if (loadedGroups.length > 0) {
          const allGroupIds = loadedGroups.map((g) => g.taskBoardId);
          setExpandedGroups(new Set(allGroupIds));
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setTaskGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [schedule, folderId]);

  const toggleGroup = (taskBoardId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskBoardId)) {
        newSet.delete(taskBoardId);
      } else {
        newSet.add(taskBoardId);
      }
      return newSet;
    });
  };

  const handleTaskStatusChange = useCallback(
    async (
      taskId: string,
      newStatus: TaskStatus,
      targetIndex?: number,
      groupTaskBoardId?: string,
    ) => {
      await handleMultipleBoardsTaskStatusChange(
        taskGroups,
        setTaskGroups,
        taskId,
        newStatus,
        targetIndex,
      );
    },
    [taskGroups],
  );

  return (
    <BoardContainer>
      <Toolbar workspaceTitle={workspaceTitle} />

      <Board>
        {isLoading ? (
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : taskGroups.length > 0 ? (
          <>
            {/* Workspace rows with tasks */}
            {taskGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.taskBoardId);
              return (
                <div key={group.taskBoardId} style={{ display: "contents" }}>
                  {/* Separator above each task board row */}
                  <WorkspaceSeparator
                    onClick={() => toggleGroup(group.taskBoardId)}
                    style={{ cursor: "pointer" }}
                  >
                    <Chevron
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      $expanded={isExpanded}
                      style={{ marginLeft: 0 }}
                    >
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Chevron>
                    {group.taskBoardName}
                  </WorkspaceSeparator>

                  {/* Tasks for this workspace in each column - only show if expanded */}
                  {isExpanded && (
                    <>
                      <Column
                        tasks={group.tasks[TaskStatus.TODO]}
                        status={TaskStatus.TODO}
                        onTaskDrop={(taskId, newStatus, targetIndex) =>
                          handleTaskStatusChange(
                            taskId,
                            newStatus,
                            targetIndex,
                            group.taskBoardId,
                          )
                        }
                      />
                      <Column
                        tasks={group.tasks[TaskStatus.IN_PROGRESS]}
                        status={TaskStatus.IN_PROGRESS}
                        onTaskDrop={(taskId, newStatus, targetIndex) =>
                          handleTaskStatusChange(
                            taskId,
                            newStatus,
                            targetIndex,
                            group.taskBoardId,
                          )
                        }
                      />
                      <Column
                        tasks={group.tasks[TaskStatus.DONE]}
                        status={TaskStatus.DONE}
                        onTaskDrop={(taskId, newStatus, targetIndex) =>
                          handleTaskStatusChange(
                            taskId,
                            newStatus,
                            targetIndex,
                            group.taskBoardId,
                          )
                        }
                      />
                    </>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ color: "#fff", padding: "24px", gridColumn: "1 / -1" }}>
            No tasks available for {workspaceTitle}
          </div>
        )}
      </Board>
    </BoardContainer>
  );
}
