"use client";

import {
  createContext,
  use,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Folder, Task, TaskBoard, UpdateTaskBody } from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";

import {
  groupRootsByStatus,
  isSameLocalDay,
  nestTasks,
  startOfLocalDay,
  type NestedTask,
} from "./task-helpers";

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const createInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<TasksView>({ kind: "board", boardId: null });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastBoardId, setLastBoardId] = useState<string | null>(null);

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: () => todexClient.folders.list(),
  });
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.boards.list(),
  });

  const folders = foldersQuery.data ?? [];
  const boards = boardsQuery.data ?? [];
  const selectedBoardId =
    view.kind === "board" ? (view.boardId ?? boards[0]?.id ?? null) : null;

  const boardTasksQuery = useQuery({
    queryKey: ["tasks", selectedBoardId],
    queryFn: () => todexClient.tasks.list(selectedBoardId!),
    enabled: view.kind === "board" && !!selectedBoardId,
  });

  const scheduleQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: ["tasks", board.id],
      queryFn: () => todexClient.tasks.list(board.id),
      enabled: view.kind === "schedule",
    })),
  });

  const tasks = useMemo(() => {
    if (view.kind === "schedule") {
      return scheduleQueries.flatMap((query) => query.data ?? []);
    }
    return boardTasksQuery.data ?? [];
  }, [view.kind, scheduleQueries, boardTasksQuery.data]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (view.kind === "schedule") {
      const day = startOfLocalDay(view.schedule === "tomorrow" ? 1 : 0);
      return tasks.filter(
        (task) =>
          isSameLocalDay(task.dueDate, day) &&
          (!query ||
            task.summary.toLowerCase().includes(query) ||
            task.taskKey.toLowerCase().includes(query)),
      );
    }
    if (!query) return tasks;
    return tasks.filter(
      (task) =>
        task.summary.toLowerCase().includes(query) ||
        task.taskKey.toLowerCase().includes(query),
    );
  }, [tasks, search, view]);

  const tree = useMemo(() => nestTasks(visibleTasks), [visibleTasks]);
  const groups = useMemo(() => groupRootsByStatus(tree), [tree]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedBoard =
    boards.find((board) => board.id === selectedBoardId) ?? null;
  const createBoardId =
    view.kind === "board"
      ? selectedBoardId
      : (lastBoardId ?? boards[0]?.id ?? null);

  const invalidateTasks = (boardId?: string | null) => {
    if (boardId) {
      void queryClient.invalidateQueries({ queryKey: ["tasks", boardId] });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const createFolder = useMutation({
    mutationFn: (name: string) =>
      todexClient.folders.create({ name, kind: "tasks" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const createBoard = useMutation({
    mutationFn: (input: { name: string; folderId: string | null }) =>
      todexClient.boards.create(input),
    onSuccess: (board) => {
      setLastBoardId(board.id);
      setView({ kind: "board", boardId: board.id });
      void queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  const createTask = useMutation({
    mutationFn: (input: { summary: string; parentTaskId?: string | null }) => {
      if (!createBoardId) throw new Error("No board");
      return todexClient.tasks.create({
        taskBoardId: createBoardId,
        summary: input.summary,
        parentTaskId: input.parentTaskId,
      });
    },
    onSuccess: () => invalidateTasks(createBoardId),
  });

  const updateTask = useMutation({
    mutationFn: (input: { taskId: string; body: UpdateTaskBody }) =>
      todexClient.tasks.update(input.taskId, input.body),
    onSuccess: (task) => invalidateTasks(task.taskBoardId),
  });

  const removeTask = useMutation({
    mutationFn: (taskId: string) => todexClient.tasks.remove(taskId),
    onSuccess: () => {
      setSelectedTaskId(null);
      invalidateTasks();
    },
  });

  const selectBoard = (boardId: string) => {
    setLastBoardId(boardId);
    setView({ kind: "board", boardId });
    setSelectedTaskId(null);
  };

  const selectSchedule = (schedule: "today" | "tomorrow") => {
    setView({ kind: "schedule", schedule });
    setSelectedTaskId(null);
  };

  const value: TasksContextValue = {
    state: {
      folders,
      boards,
      tasks,
      groups,
      view,
      selectedBoard,
      selectedTask,
      selectedTaskId,
      search,
      createBoardId,
    },
    actions: {
      selectBoard,
      selectSchedule,
      setSelectedTaskId,
      setSearch,
      createFolder: (name) => createFolder.mutate(name),
      createBoard: (name, folderId) => createBoard.mutate({ name, folderId }),
      createTask: (summary, parentTaskId) =>
        createTask.mutate({ summary, parentTaskId }),
      updateTask: (taskId, body) => updateTask.mutate({ taskId, body }),
      removeTask: (taskId) => removeTask.mutate(taskId),
    },
    meta: {
      createInputRef,
      isLoading: foldersQuery.isLoading || boardsQuery.isLoading,
    },
  };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const value = use(TasksContext);
  if (!value) throw new Error("useTasks must be used within TasksProvider");
  return value;
}

export type TasksView =
  | { kind: "board"; boardId: string | null }
  | { kind: "schedule"; schedule: "today" | "tomorrow" };

interface TasksContextValue {
  state: {
    folders: Folder[];
    boards: TaskBoard[];
    tasks: Task[];
    groups: Record<Task["status"], NestedTask[]>;
    view: TasksView;
    selectedBoard: TaskBoard | null;
    selectedTask: Task | null;
    selectedTaskId: string | null;
    search: string;
    createBoardId: string | null;
  };
  actions: {
    selectBoard: (boardId: string) => void;
    selectSchedule: (schedule: "today" | "tomorrow") => void;
    setSelectedTaskId: (taskId: string | null) => void;
    setSearch: (search: string) => void;
    createFolder: (name: string) => void;
    createBoard: (name: string, folderId: string | null) => void;
    createTask: (summary: string, parentTaskId?: string | null) => void;
    updateTask: (taskId: string, body: UpdateTaskBody) => void;
    removeTask: (taskId: string) => void;
  };
  meta: {
    createInputRef: RefObject<HTMLInputElement>;
    isLoading: boolean;
  };
}
