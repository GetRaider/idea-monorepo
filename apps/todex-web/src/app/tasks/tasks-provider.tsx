"use client";

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Folder,
  MoveTaskBody,
  Task,
  TaskBoard,
  UpdateFolderBody,
  UpdateTaskBoardBody,
  UpdateTaskBody,
} from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";
import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";

import {
  applyRootMove,
  groupRootsByStatus,
  INBOX_BOARD_NAME,
  localDayScheduleQuery,
  nestTasks,
  type NestedTask,
  type TaskCreateDraft,
} from "./task-helpers";

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const createInputRef = useRef<HTMLInputElement>(null);
  const dismissedTaskKeyRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  const didEnsureInboxRef = useRef(false);
  const [selectedTaskId, setSelectedTaskIdState] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [scheduleTargetBoardId, setScheduleTargetBoardId] = useState<
    string | null
  >(null);

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
  const view = resolveTasksView(pathname, boards);

  const selectedBoardId = view.kind === "board" ? view.boardId : null;
  const selectedBoard =
    boards.find((board) => board.id === selectedBoardId) ?? null;
  const scheduleQuery =
    view.kind === "schedule"
      ? localDayScheduleQuery(view.schedule === "today" ? 0 : 1)
      : null;
  const inboxBoardId =
    boards.find((board) => board.name === INBOX_BOARD_NAME)?.id ?? null;
  const resolvedScheduleBoardId =
    (scheduleTargetBoardId &&
    boards.some((board) => board.id === scheduleTargetBoardId)
      ? scheduleTargetBoardId
      : null) ??
    inboxBoardId ??
    boards[0]?.id ??
    null;
  const createBoardId =
    view.kind === "board"
      ? selectedBoardId
      : view.kind === "schedule"
        ? resolvedScheduleBoardId
        : null;

  const rootBoardKey = boards.map((board) => board.id).join("\n");
  const rootTasksQuery = useQuery({
    queryKey: ["tasks", "root", rootBoardKey],
    queryFn: () =>
      Promise.all(
        boards.map((board) => todexClient.tasks.list({ boardId: board.id })),
      ).then((lists) => lists.flat()),
    enabled: view.kind === "root" && boards.length > 0,
  });
  const boardTasksQuery = useQuery({
    queryKey: ["tasks", selectedBoardId],
    queryFn: () => todexClient.tasks.list({ boardId: selectedBoardId! }),
    enabled: view.kind === "board" && !!selectedBoardId,
  });
  const scheduleTasksQuery = useQuery({
    queryKey: [
      "tasks",
      "schedule",
      scheduleQuery?.scheduleFrom,
      scheduleQuery?.scheduleTo,
    ],
    queryFn: () => todexClient.tasks.list(scheduleQuery!),
    enabled: view.kind === "schedule" && !!scheduleQuery,
  });

  const loadedTasks = useMemo(() => {
    if (view.kind === "schedule") return scheduleTasksQuery.data ?? [];
    if (view.kind === "root") return rootTasksQuery.data ?? [];
    return boardTasksQuery.data ?? [];
  }, [
    view.kind,
    scheduleTasksQuery.data,
    rootTasksQuery.data,
    boardTasksQuery.data,
  ]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return loadedTasks;
    return loadedTasks.filter(
      (task) =>
        task.summary.toLowerCase().includes(query) ||
        task.taskKey.toLowerCase().includes(query),
    );
  }, [loadedTasks, search]);

  const tasks = loadedTasks;
  const isTasksLoading =
    view.kind === "schedule"
      ? scheduleTasksQuery.isLoading
      : view.kind === "root"
        ? boards.length > 0 && rootTasksQuery.isLoading
        : boardTasksQuery.isLoading;

  const tree = useMemo(() => nestTasks(visibleTasks), [visibleTasks]);
  const groups = useMemo(() => groupRootsByStatus(tree), [tree]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const setSelectedTaskId = (taskId: string | null) => {
    if (taskId == null) {
      dismissedTaskKeyRef.current =
        tasksUrlHelper.routing.getTaskKeyFromPathname(pathname) ?? null;
    } else {
      dismissedTaskKeyRef.current = null;
    }
    setSelectedTaskIdState(taskId);
    const taskKey =
      taskId == null
        ? undefined
        : loadedTasks.find((task) => task.id === taskId)?.taskKey;
    const href = hrefForTasksView(view, taskKey);
    if (href && href !== pathname) {
      router.replace(href);
    }
  };

  const viewHref = hrefForTasksView(view);

  useEffect(() => {
    const previousPathname = pathnameRef.current;
    pathnameRef.current = pathname;
    if (view.kind === "root") {
      dismissedTaskKeyRef.current = null;
      setSelectedTaskIdState(null);
      return;
    }
    if (isTasksLoading) return;
    const taskKey = tasksUrlHelper.routing.getTaskKeyFromPathname(pathname);
    if (taskKey && taskKey === dismissedTaskKeyRef.current) return;
    if (taskKey) {
      dismissedTaskKeyRef.current = null;
      const match = loadedTasks.find((task) => task.taskKey === taskKey);
      if (match) {
        setSelectedTaskIdState(match.id);
        return;
      }
      setSelectedTaskIdState(null);
      if (viewHref && viewHref !== pathname) {
        router.replace(viewHref);
      }
      return;
    }
    const previousTaskKey =
      tasksUrlHelper.routing.getTaskKeyFromPathname(previousPathname);
    if (previousPathname !== pathname && previousTaskKey) {
      dismissedTaskKeyRef.current = null;
      setSelectedTaskIdState(null);
    }
  }, [isTasksLoading, loadedTasks, pathname, router, view.kind, viewHref]);

  const invalidateTasks = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const invalidateSpaces = () => {
    void queryClient.invalidateQueries({ queryKey: ["folders"] });
    void queryClient.invalidateQueries({ queryKey: ["boards"] });
  };

  const createFolder = useMutation({
    mutationFn: (name: string) =>
      todexClient.folders.create({ name, kind: "tasks" }),
    onSuccess: (folder) => {
      queryClient.setQueryData<Folder[]>(["folders"], (current) =>
        current ? [...current, folder] : [folder],
      );
      toast.success(`Folder "${folder.name}" created`);
    },
    onError: () => toast.error("Could not create folder"),
  });

  const updateFolder = useMutation({
    mutationFn: (input: { folderId: string; body: UpdateFolderBody }) =>
      todexClient.folders.update(input.folderId, input.body),
    onSuccess: (folder) => {
      invalidateSpaces();
      toast.success(`Folder "${folder.name}" saved`);
    },
    onError: () => toast.error("Could not save folder"),
  });

  const removeFolder = useMutation({
    mutationFn: (folderId: string) => todexClient.folders.remove(folderId),
    onSuccess: () => {
      invalidateSpaces();
      toast.success("Folder deleted");
    },
    onError: () => toast.error("Could not delete folder"),
  });

  const createBoard = useMutation({
    mutationFn: (input: {
      name: string;
      folderId: string | null;
      quiet?: boolean;
    }) =>
      todexClient.boards.create({
        name: input.name,
        folderId: input.folderId,
      }),
    onSuccess: (board, input) => {
      queryClient.setQueryData<TaskBoard[]>(["boards"], (current) =>
        current ? [...current, board] : [board],
      );
      if (input.quiet) return;
      toast.success(`Board "${board.name}" created`);
      router.push(tasksUrlHelper.routing.buildBoardUrl(board.name));
    },
    onError: (_error, input) => {
      if (input.quiet) didEnsureInboxRef.current = false;
      toast.error("Could not create board");
    },
  });

  useEffect(() => {
    const currentBoards = boardsQuery.data ?? [];
    if (boardsQuery.isLoading || boardsQuery.isError) return;
    if (currentBoards.some((board) => board.name === INBOX_BOARD_NAME)) return;
    if (didEnsureInboxRef.current) return;
    didEnsureInboxRef.current = true;
    createBoard.mutate({
      name: INBOX_BOARD_NAME,
      folderId: null,
      quiet: true,
    });
  }, [
    boardsQuery.data,
    boardsQuery.isError,
    boardsQuery.isLoading,
    createBoard,
  ]);

  const updateBoard = useMutation({
    mutationFn: (input: { boardId: string; body: UpdateTaskBoardBody }) =>
      todexClient.boards.update(input.boardId, input.body),
    onSuccess: (board) => {
      queryClient.setQueryData<TaskBoard[]>(
        ["boards"],
        (current) =>
          current?.map((item) => (item.id === board.id ? board : item)) ?? [
            board,
          ],
      );
      toast.success(`Board "${board.name}" saved`);
      if (selectedBoardId === board.id) {
        router.replace(
          tasksUrlHelper.routing.buildBoardUrl(
            board.name,
            selectedTask?.taskKey,
          ),
        );
      }
    },
    onError: () => toast.error("Could not save board"),
  });

  const removeBoard = useMutation({
    mutationFn: (boardId: string) => todexClient.boards.remove(boardId),
    onSuccess: (_result, boardId) => {
      invalidateSpaces();
      invalidateTasks();
      toast.success("Board deleted");
      if (selectedBoardId === boardId) {
        setSelectedTaskId(null);
        router.push(tasksUrlHelper.routing.buildRootUrl());
      }
    },
    onError: () => toast.error("Could not delete board"),
  });

  const createTask = useMutation({
    mutationFn: (
      input: {
        summary: string;
        parentTaskId?: string | null;
      } & TaskCreateDraft,
    ) => {
      const taskBoardId = input.taskBoardId ?? createBoardId;
      if (!taskBoardId) throw new Error("No board");
      return todexClient.tasks.create({
        taskBoardId,
        summary: input.summary,
        ...(input.parentTaskId ? { parentTaskId: input.parentTaskId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.estimation !== undefined
          ? { estimation: input.estimation }
          : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.scheduleDate !== undefined
          ? { scheduleDate: input.scheduleDate }
          : view.kind === "schedule" && scheduleQuery
            ? { scheduleDate: scheduleQuery.scheduleFrom }
            : {}),
      });
    },
    onSuccess: (task) => {
      invalidateTasks();
      toast.success(`Task "${task.summary}" created`);
    },
    onError: () => toast.error("Could not create task"),
  });

  const updateTask = useMutation({
    mutationFn: (input: {
      taskId: string;
      body: UpdateTaskBody;
      optimistic?: boolean;
    }) => todexClient.tasks.update(input.taskId, input.body),
    onMutate: async (input) => {
      if (!input.optimistic) return;
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      });
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (current) =>
        applyOptimisticTaskPatch(current, input.taskId, input.body),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Could not save task");
    },
    onSuccess: (_task, input) => {
      if (input.optimistic) return;
      toast.success("Task saved");
    },
    onSettled: () => {
      invalidateTasks();
    },
  });

  const moveTask = useMutation({
    mutationFn: (input: { taskId: string; body: MoveTaskBody }) =>
      todexClient.tasks.move(input.taskId, input.body),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      });
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (current) => {
        if (!current) return current;
        const task = current.find((item) => item.id === input.taskId);
        if (!task || task.parentTaskId) return current;
        const index =
          input.body.index ??
          current.filter(
            (item) =>
              item.parentTaskId == null &&
              item.taskBoardId === task.taskBoardId &&
              item.status === input.body.status &&
              item.id !== task.id,
          ).length;
        return applyRootMove(current, input.taskId, input.body.status, index);
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Could not move task");
    },
    onSettled: () => {
      invalidateTasks();
    },
  });

  const removeTask = useMutation({
    mutationFn: (taskId: string) => todexClient.tasks.remove(taskId),
    onSuccess: () => {
      setSelectedTaskId(null);
      invalidateTasks();
      toast.success("Task deleted");
    },
    onError: () => toast.error("Could not delete task"),
  });

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
      isCreateDialogOpen,
    },
    actions: {
      setSelectedTaskId,
      setSearch,
      setScheduleTargetBoardId,
      openCreateDialog: () => setIsCreateDialogOpen(true),
      closeCreateDialog: () => setIsCreateDialogOpen(false),
      createFolder: (name) => createFolder.mutateAsync(name),
      updateFolder: (folderId, body) =>
        updateFolder.mutateAsync({ folderId, body }),
      removeFolder: async (folderId) => {
        await removeFolder.mutateAsync(folderId);
      },
      createBoard: (name, folderId) =>
        createBoard.mutateAsync({ name, folderId }),
      updateBoard: (boardId, body) =>
        updateBoard.mutateAsync({ boardId, body }),
      removeBoard: async (boardId) => {
        await removeBoard.mutateAsync(boardId);
      },
      createTask: (summary, parentTaskId, draft) =>
        createTask.mutate({ summary, parentTaskId, ...draft }),
      updateTask: (taskId, body, options) =>
        updateTask.mutate({ taskId, body, optimistic: options?.quiet }),
      updateTaskStatus: (taskId, status) =>
        updateTask.mutate({ taskId, body: { status }, optimistic: true }),
      moveTask: (taskId, body) => moveTask.mutate({ taskId, body }),
      removeTask: (taskId) => removeTask.mutate(taskId),
    },
    meta: {
      createInputRef,
      isLoading: foldersQuery.isLoading || boardsQuery.isLoading,
      isTasksLoading,
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

function applyOptimisticTaskPatch(
  tasks: Task[] | undefined,
  taskId: string,
  body: UpdateTaskBody,
): Task[] | undefined {
  if (!tasks) return tasks;
  const statusOnly =
    body.status != null &&
    body.taskBoardId == null &&
    body.summary == null &&
    body.description == null &&
    body.priority == null &&
    body.dueDate === undefined &&
    body.scheduleDate === undefined &&
    body.estimation === undefined &&
    body.parentTaskId === undefined;
  if (statusOnly && body.status) {
    const task = tasks.find((item) => item.id === taskId);
    if (task && task.parentTaskId == null && task.status !== body.status) {
      const index = tasks.filter(
        (item) =>
          item.parentTaskId == null &&
          item.taskBoardId === task.taskBoardId &&
          item.status === body.status &&
          item.id !== task.id,
      ).length;
      return applyRootMove(tasks, taskId, body.status, index);
    }
  }
  return tasks.map((task) =>
    task.id === taskId ? { ...task, ...body } : task,
  );
}

function hrefForTasksView(view: TasksView, taskKey?: string): string | null {
  if (view.kind === "board") {
    return tasksUrlHelper.routing.buildBoardUrl(view.boardName, taskKey);
  }
  if (view.kind === "schedule") {
    return tasksUrlHelper.routing.buildScheduleUrl(view.schedule, taskKey);
  }
  return null;
}

function resolveTasksView(pathname: string, boards: TaskBoard[]): TasksView {
  const activeView = tasksUrlHelper.routing.getActiveViewFromPathname(pathname);
  if (activeView === "today" || activeView === "tomorrow") {
    return { kind: "schedule", schedule: activeView };
  }
  if (activeView === TASKS_ROOT_VIEW_ID || activeView === "") {
    return { kind: "root" };
  }
  const board = boards.find((item) => item.name === activeView);
  return { kind: "board", boardId: board?.id ?? null, boardName: activeView };
}

export type TasksView =
  | { kind: "root" }
  | { kind: "board"; boardId: string | null; boardName: string }
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
    isCreateDialogOpen: boolean;
  };
  actions: {
    setSelectedTaskId: (taskId: string | null) => void;
    setSearch: (search: string) => void;
    setScheduleTargetBoardId: (boardId: string) => void;
    openCreateDialog: () => void;
    closeCreateDialog: () => void;
    createFolder: (name: string) => Promise<Folder>;
    updateFolder: (folderId: string, body: UpdateFolderBody) => Promise<Folder>;
    removeFolder: (folderId: string) => Promise<void>;
    createBoard: (name: string, folderId: string | null) => Promise<TaskBoard>;
    updateBoard: (
      boardId: string,
      body: UpdateTaskBoardBody,
    ) => Promise<TaskBoard>;
    removeBoard: (boardId: string) => Promise<void>;
    createTask: (
      summary: string,
      parentTaskId?: string | null,
      draft?: TaskCreateDraft,
    ) => void;
    updateTask: (
      taskId: string,
      body: UpdateTaskBody,
      options?: { quiet?: boolean },
    ) => void;
    updateTaskStatus: (taskId: string, status: Task["status"]) => void;
    moveTask: (taskId: string, body: MoveTaskBody) => void;
    removeTask: (taskId: string) => void;
  };
  meta: {
    createInputRef: RefObject<HTMLInputElement>;
    isLoading: boolean;
    isTasksLoading: boolean;
  };
}
