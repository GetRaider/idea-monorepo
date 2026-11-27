"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CounterStatus,
  CreateCounterBody,
  LogCounterOccurrenceBody,
  UpdateCounterBody,
} from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";

export const COUNTERS_QUERY_KEY = ["counters"] as const;

// Task completions change Counters from other screens, so reads are never fresh.
export function useCounterList(status: CounterStatus) {
  return useQuery({
    queryKey: [...COUNTERS_QUERY_KEY, "list", status],
    queryFn: () => todexClient.counters.list(status),
    staleTime: 0,
  });
}

export function useCounter(counterId: string) {
  return useQuery({
    queryKey: [...COUNTERS_QUERY_KEY, "detail", counterId],
    queryFn: () => todexClient.counters.get(counterId),
    staleTime: 0,
  });
}

export function useCreateCounter(onCreated: (counterId: string) => void) {
  const invalidate = useInvalidateCounters();
  return useMutation({
    mutationFn: (body: CreateCounterBody) => todexClient.counters.create(body),
    onSuccess: (counter) => onCreated(counter.id),
    onError: showError,
    onSettled: invalidate,
  });
}

/** Writes for one Counter. `isPending` guards against double submits. */
export function useCounterActions(counterId: string) {
  const invalidate = useInvalidateCounters();
  const remove = useMutation({
    mutationFn: (occurrenceId: string) =>
      todexClient.counters.removeOccurrence(counterId, occurrenceId),
    onError: showError,
    onSettled: invalidate,
  });
  const log = useMutation({
    mutationFn: (body: LogCounterOccurrenceBody) =>
      todexClient.counters.log(counterId, body),
    onSuccess: (result, body) => {
      const logged = body.status === "completed" ? "Completion" : "Skip";
      toast.success(`${logged} added to ${result.counter.name}`, {
        action: {
          label: "Undo",
          onClick: () => remove.mutate(result.occurrenceId),
        },
      });
    },
    onError: showError,
    onSettled: invalidate,
  });
  const update = useMutation({
    mutationFn: (body: UpdateCounterBody) =>
      todexClient.counters.update(counterId, body),
    onError: showError,
    onSettled: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: (status: CounterStatus) =>
      status === "archived"
        ? todexClient.counters.archive(counterId)
        : todexClient.counters.restore(counterId),
    onError: showError,
    onSettled: invalidate,
  });
  const addLink = useMutation({
    mutationFn: (taskId: string) =>
      todexClient.counters.addLink(counterId, taskId),
    onError: showError,
    onSettled: invalidate,
  });
  const removeLink = useMutation({
    mutationFn: (linkId: string) =>
      todexClient.counters.removeLink(counterId, linkId),
    onError: showError,
    onSettled: invalidate,
  });
  return {
    log,
    remove,
    update,
    setStatus,
    addLink,
    removeLink,
    isPending: log.isPending || remove.isPending || setStatus.isPending,
  };
}

function useInvalidateCounters() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: COUNTERS_QUERY_KEY });
}

function showError(error: Error) {
  toast.error(error.message);
}
