"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

export function useExecutionCommands() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function execute(taskId: string) {
    try {
      await todexClient.execution.execute({ taskIds: [taskId] });
      await queryClient.invalidateQueries({ queryKey: ["execution"] });
      router.push("/execution");
    } catch (error) {
      toast.error(readError(error, "Could not execute the task"));
    }
  }

  async function enqueue(taskId: string) {
    try {
      await todexClient.execution.enqueue({ taskId });
      await queryClient.invalidateQueries({ queryKey: ["execution"] });
      toast.success("Added to the execution queue");
    } catch (error) {
      toast.error(readError(error, "Could not add to the execution queue"));
    }
  }

  return { execute, enqueue };
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
