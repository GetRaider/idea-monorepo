"use client";

import { Spinner } from "@repo/ui";

import { useExecution } from "../execution-provider";
import { ExecutionSessionList } from "../execution-session-list";
import { ExecutionCanvas } from "../execution-sidebar";

export default function ExecutionHistoryPage() {
  const {
    state: { sessions, isLoading, isError },
    actions: { updateSession, deleteSession },
  } = useExecution();
  const completed = sessions.filter((session) => session.endedAt != null);

  return (
    <ExecutionCanvas title="History">
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Could not load execution.</p>
      ) : (
        <ExecutionSessionList
          sessions={completed}
          empty="No completed executions yet."
          onUpdate={updateSession}
          onDelete={deleteSession}
        />
      )}
    </ExecutionCanvas>
  );
}
