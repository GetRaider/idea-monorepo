import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  LIFE_AREA_IDS,
  LIFE_AREA_NAMES,
  type Habit,
  type HabitListResponse,
  type LifeArea,
  type TodayCheckpoint,
} from "@repo/evolin-shared";

import { Button, Text } from "@/components/ui";
import { AppShell } from "@/features/habits/app-shell";
import { CheckInSheet } from "@/features/habits/check-in-sheet";
import { SKIP_REASON_LABELS } from "@/features/habits/constants";
import {
  CheckpointButton,
  StreakChip,
  SummaryChip,
} from "@/features/habits/marks";
import { listHabits, putCheckIn } from "@/lib/api/habits";

export default function TodayScreen() {
  const habitsQuery = useQuery({
    queryKey: ["habits"],
    queryFn: listHabits,
  });
  const [selection, setSelection] = useState<CheckInSelection | null>(null);
  const checkInMutation = useCheckInMutation(() => setSelection(null));
  const scheduledHabits =
    habitsQuery.data?.habits.filter((habit) => habit.scheduledToday) ?? [];
  const summary = summarizeToday(scheduledHabits);
  const lifeAreas = [...(habitsQuery.data?.lifeAreas ?? [])].sort(
    (left, right) =>
      LIFE_AREA_IDS.indexOf(left.id) - LIFE_AREA_IDS.indexOf(right.id),
  );

  return (
    <AppShell current="today">
      <Text className="text-4xl font-bold">Today</Text>
      <View className="mt-4 flex-row flex-wrap gap-4">
        <SummaryChip kind="completed" label={`${summary.completed} done`} />
        <SummaryChip kind="failed" label={`${summary.failed} failed`} />
        <SummaryChip kind="skipped" label={`${summary.skipped} skipped`} />
        <SummaryChip kind="open" label={`${summary.open} open`} />
      </View>

      {habitsQuery.isError ? (
        <View className="mt-6 gap-3 rounded-2xl bg-white p-4">
          <Text className="font-semibold">Could not reach Evolin API.</Text>
          <Button variant="outline" onPress={() => void habitsQuery.refetch()}>
            Retry
          </Button>
        </View>
      ) : null}

      {habitsQuery.data && scheduledHabits.length === 0 ? (
        <View className="mt-8 rounded-2xl bg-white p-5">
          <Text className="text-lg font-semibold">
            Nothing scheduled today.
          </Text>
          <Text className="mt-1 text-muted">
            Establishing habits show up here on their scheduled days.
          </Text>
        </View>
      ) : null}

      <View className="mt-8 gap-8">
        {lifeAreas.map((lifeArea) => (
          <LifeAreaGroup
            key={lifeArea.id}
            habits={scheduledHabits.filter(
              (habit) => habit.lifeAreaId === lifeArea.id,
            )}
            lifeArea={lifeArea}
            onSelectCheckpoint={(habit, checkpoint) =>
              setSelection({ habit, checkpoint })
            }
          />
        ))}
      </View>

      {selection ? (
        <CheckInSheet
          checkpoint={selection.checkpoint}
          habit={selection.habit}
          isPending={checkInMutation.isPending}
          lifeArea={habitsQuery.data?.lifeAreas.find(
            (lifeArea) => lifeArea.id === selection.habit.lifeAreaId,
          )}
          onClose={() => setSelection(null)}
          onSave={(input) =>
            checkInMutation.mutate({
              habitId: selection.habit.id,
              checkpointIndex: selection.checkpoint.index,
              ...input,
            })
          }
        />
      ) : null}
    </AppShell>
  );
}

function useCheckInMutation(onSaved: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInMutationInput) =>
      putCheckIn(input.habitId, todayDate(), input.checkpointIndex, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previous = queryClient.getQueryData<HabitListResponse>(["habits"]);
      queryClient.setQueryData<HabitListResponse>(["habits"], (current) => {
        if (!current) return current;
        return {
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === input.habitId
              ? {
                  ...habit,
                  todayCheckpoints: habit.todayCheckpoints.map((checkpoint) =>
                    checkpoint.index === input.checkpointIndex
                      ? {
                          ...checkpoint,
                          status: input.status,
                          skipReason: input.skipReason,
                          note: input.note,
                        }
                      : checkpoint,
                  ),
                }
              : habit,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous)
        queryClient.setQueryData(["habits"], context.previous);
    },
    onSuccess: (response) => {
      queryClient.setQueryData<HabitListResponse>(["habits"], (current) => {
        if (!current) return current;
        return {
          lifeAreas: response.lifeAreas,
          habits: current.habits.map((habit) =>
            habit.id === response.habit.id ? response.habit : habit,
          ),
        };
      });
      void queryClient.invalidateQueries({ queryKey: ["week"] });
      onSaved();
    },
  });
}

function LifeAreaGroup({
  lifeArea,
  habits,
  onSelectCheckpoint,
}: {
  lifeArea: LifeArea;
  habits: Habit[];
  onSelectCheckpoint: (habit: Habit, checkpoint: TodayCheckpoint) => void;
}) {
  if (habits.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold tracking-[1.5px] text-muted">
          {LIFE_AREA_NAMES[lifeArea.id].toUpperCase()}
        </Text>
        <Text className="text-sm text-muted">
          {lifeArea.slotsUsed} of {lifeArea.slotLimit} slots used
        </Text>
      </View>
      {habits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          onSelectCheckpoint={onSelectCheckpoint}
        />
      ))}
    </View>
  );
}

function HabitRow({
  habit,
  onSelectCheckpoint,
}: {
  habit: Habit;
  onSelectCheckpoint: (habit: Habit, checkpoint: TodayCheckpoint) => void;
}) {
  const router = useRouter();
  const skipped = habit.todayCheckpoints.filter(
    (checkpoint) => checkpoint.status === "skipped" && checkpoint.skipReason,
  );

  return (
    <View className="rounded-3xl bg-white px-5 py-4">
      <View className="flex-row items-center justify-between gap-4">
        <Pressable
          accessibilityRole="link"
          className="min-w-0 flex-1 gap-1"
          onPress={() => router.push(`/habits/${habit.id}`)}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold">{habit.name}</Text>
            <StreakChip days={habit.streak} />
          </View>
          <Text className="text-sm text-muted">{habit.trigger}</Text>
          <Text className="text-sm">
            <Text className="text-sm font-semibold">Counts as done: </Text>
            {habit.acceptanceCriteria}
          </Text>
        </Pressable>
        <View className="flex-row gap-2">
          {habit.todayCheckpoints.map((checkpoint) => (
            <Pressable
              key={checkpoint.index}
              accessibilityLabel={
                checkpoint.label ?? `Checkpoint ${checkpoint.index + 1}`
              }
              accessibilityRole="button"
              className="min-h-11 min-w-11 items-center justify-center"
              onPress={() => onSelectCheckpoint(habit, checkpoint)}
            >
              <CheckpointButton
                checkpoint={checkpoint}
                label={habit.checkpointsPerDay > 1 ? checkpoint.label : null}
              />
            </Pressable>
          ))}
        </View>
      </View>
      {skipped.map((checkpoint) =>
        checkpoint.skipReason ? (
          <View
            key={checkpoint.index}
            className="mt-3 rounded-xl bg-[#f8f1dc] px-3 py-2"
          >
            <Text className="text-sm text-[#8a6a2f]">
              » Skipped · Reason: {SKIP_REASON_LABELS[checkpoint.skipReason]}
            </Text>
          </View>
        ) : null,
      )}
    </View>
  );
}

function summarizeToday(habits: Habit[]) {
  const summary = { completed: 0, failed: 0, skipped: 0, open: 0 };
  for (const habit of habits) {
    for (const checkpoint of habit.todayCheckpoints)
      summary[checkpoint.status] += 1;
  }
  return summary;
}

function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

type CheckInSelection = {
  habit: Habit;
  checkpoint: TodayCheckpoint;
};

type CheckInMutationInput = {
  habitId: string;
  checkpointIndex: number;
  status: "completed" | "failed" | "skipped";
  skipReason: TodayCheckpoint["skipReason"];
  note: string | null;
};
