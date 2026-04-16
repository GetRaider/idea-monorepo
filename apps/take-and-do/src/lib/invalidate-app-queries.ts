import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "./query-keys";

export async function invalidateTaskDataQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    queryClient.invalidateQueries({ queryKey: ["stats"] }),
    queryClient.invalidateQueries({ queryKey: ["analytics"] }),
    queryClient.invalidateQueries({ queryKey: ["kanban-multi"] }),
  ]);
}

export async function invalidateWorkspaceQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.folders }),
    queryClient.invalidateQueries({ queryKey: queryKeys.taskBoards.all }),
    queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    queryClient.invalidateQueries({ queryKey: ["kanban-multi"] }),
  ]);
}
