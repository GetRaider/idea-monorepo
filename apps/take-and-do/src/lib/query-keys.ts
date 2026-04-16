export const queryKeys = {
  folders: ["folders"] as const,
  taskBoards: {
    all: ["taskBoards"] as const,
    detail: (id: string) => ["taskBoards", "detail", id] as const,
  },
  tasks: {
    all: ["tasks", "list", "all"] as const,
    byBoard: (boardId: string) => ["tasks", "board", boardId] as const,
    byDate: (dateIso: string) => ["tasks", "date", dateIso] as const,
    schedule: ["tasks", "schedule"] as const,
    recent: (n: number) => ["tasks", "recent", n] as const,
  },
  labels: ["labels"] as const,
  stats: (timeframe: string) => ["stats", timeframe] as const,
  analytics: (timeframe: string) => ["analytics", "stats", timeframe] as const,
  kanbanMulti: (
    scheduleKey: string | undefined,
    folderId: string | undefined,
  ) => ["kanban-multi", scheduleKey ?? "none", folderId ?? "none"] as const,
} as const;
