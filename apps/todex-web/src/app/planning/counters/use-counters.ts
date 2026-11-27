"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Counter,
  CounterSection,
  CounterStatus,
  CreateCounterBody,
  SetCounterDayBody,
  UpdateCounterBody,
} from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";

import { placeCounter, type CounterMove } from "./counter-helpers";

export const COUNTERS_QUERY_KEY = ["counters"] as const;

const SECTIONS_QUERY_KEY = [...COUNTERS_QUERY_KEY, "sections"] as const;

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

export function useCounterSections() {
  return useQuery({
    queryKey: SECTIONS_QUERY_KEY,
    queryFn: () => todexClient.counterSections.list(),
  });
}

export function useSectionActions() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCounters();
  const create = useMutation({
    mutationFn: (name: string) => todexClient.counterSections.create({ name }),
    onError: showError,
    onSettled: invalidate,
  });
  const rename = useMutation({
    mutationFn: (input: { sectionId: string; name: string }) =>
      todexClient.counterSections.update(input.sectionId, { name: input.name }),
    onError: showError,
    onSettled: invalidate,
  });
  // Shown in its new place without waiting for the save.
  const move = useMutation({
    mutationFn: (input: { sectionId: string; position: number }) =>
      todexClient.counterSections.update(input.sectionId, {
        position: input.position,
      }),
    onMutate: async ({ sectionId, position }) => {
      await queryClient.cancelQueries({ queryKey: SECTIONS_QUERY_KEY });
      queryClient.setQueryData<CounterSection[]>(
        SECTIONS_QUERY_KEY,
        (sections) =>
          sections
            ?.map((section) =>
              section.id === sectionId ? { ...section, position } : section,
            )
            .sort((left, right) => left.position - right.position),
      );
    },
    onError: showError,
    onSettled: invalidate,
  });
  const remove = useMutation({
    mutationFn: (sectionId: string) =>
      todexClient.counterSections.remove(sectionId),
    onError: showError,
    onSettled: invalidate,
  });
  return { create, rename, move, remove };
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

/** Reorders a Counter, in or across space sections, without waiting. */
export function useMoveCounter() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCounters();
  const listKey = [...COUNTERS_QUERY_KEY, "list"];
  return useMutation({
    mutationFn: ({ counterId, ...move }: CounterMove & { counterId: string }) =>
      todexClient.counters.update(counterId, move),
    onMutate: async ({ counterId, ...move }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueriesData<Counter[]>({
        queryKey: listKey,
      });
      queryClient.setQueriesData<Counter[]>(
        { queryKey: listKey },
        (counters) => counters && placeCounter(counters, counterId, move),
      );
      return { previous };
    },
    onError: (error, _input, context) => {
      for (const [queryKey, counters] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, counters);
      }
      showError(error);
    },
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
