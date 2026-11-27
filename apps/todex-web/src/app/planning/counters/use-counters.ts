"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CounterStatus,
  CreateCounterBody,
  SetCounterDayBody,
  UpdateCounterBody,
} from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";

export const COUNTERS_QUERY_KEY = ["counters"] as const;

// Task completions change Counters from other screens, so reads are never fresh.
export function useCounterList(status: CounterStatus, until: string) {
  return useQuery({
    queryKey: [...COUNTERS_QUERY_KEY, "list", status, until],
    queryFn: () => todexClient.counters.list(status, until),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useCounter(counterId: string, until: string) {
  return useQuery({
    queryKey: [...COUNTERS_QUERY_KEY, "detail", counterId, until],
    queryFn: () => todexClient.counters.get(counterId, until),
    staleTime: 0,
    placeholderData: keepPreviousData,
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
  const setDay = useMutation({
    mutationFn: (input: { date: string; change: SetCounterDayBody }) =>
      todexClient.counters.setDay(counterId, input.date, input.change),
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
    setDay,
    remove,
    update,
    setStatus,
    addLink,
    removeLink,
    isPending: setDay.isPending || remove.isPending || setStatus.isPending,
  };
}

function useInvalidateCounters() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: COUNTERS_QUERY_KEY });
}

function showError(error: Error) {
  toast.error(error.message);
}
