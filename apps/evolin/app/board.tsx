import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import {
  ESTABLISHMENT_COMPLETION_THRESHOLD,
  ESTABLISHMENT_WINDOW_DAYS,
  LIFE_AREA_NAMES,
  type Habit,
  type HabitStatus,
  type LifeArea,
} from "@repo/evolin-shared";

import { Button, Text } from "@/components/ui";
import { AppShell, formatEstablishedDate } from "@/features/habits/app-shell";
import { formatRate } from "@/features/habits/constants";
import { listHabits, startEstablishing } from "@/lib/api/habits";
import { cn } from "@/lib/utils";

const COLUMNS: HabitStatus[] = ["backlog", "establishing", "established"];

export default function BoardScreen() {
  const habitsQuery = useQuery({
    queryKey: ["habits"],
    queryFn: listHabits,
  });
  const queryClient = useQueryClient();
  const startMutation = useMutation({
    mutationFn: startEstablishing,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["habits"] });
      void queryClient.invalidateQueries({ queryKey: ["week"] });
    },
  });
  const activeAreas =
    habitsQuery.data?.lifeAreas.filter((lifeArea) => lifeArea.slotsUsed > 0) ??
    [];

  return (
    <AppShell current="board" width="max-w-[1180px]">
      <Text className="text-4xl font-bold">Board</Text>
      <View className="mt-5 flex-row flex-wrap items-center gap-2">
        <Text className="mr-1 text-sm text-muted">Establishing slots</Text>
        {activeAreas.map((lifeArea) => {
          const full = lifeArea.slotsUsed >= lifeArea.slotLimit;
          return (
            <View
              key={lifeArea.id}
              className={cn(
                "min-h-8 flex-row items-center rounded-full px-3",
                full ? "bg-[#f8efd4]" : "bg-white",
              )}
            >
              <Text
                className={cn(
                  "text-sm",
                  full ? "text-[#8a6a2f]" : "text-foreground",
                )}
              >
                {full ? "⚠ " : ""}
                {LIFE_AREA_NAMES[lifeArea.id]} {lifeArea.slotsUsed} /{" "}
                {lifeArea.slotLimit}
                {full ? " · full" : ""}
              </Text>
            </View>
          );
        })}
      </View>

      {habitsQuery.isError ? (
        <View className="mt-6 gap-3">
          <Text className="font-semibold">Could not reach Evolin API.</Text>
          <Button variant="outline" onPress={() => void habitsQuery.refetch()}>
            Retry
          </Button>
        </View>
      ) : null}

      {habitsQuery.data ? (
        <View className="mt-6 gap-4 lg:flex-row lg:items-start">
          {COLUMNS.map((status) => {
            const habits = habitsQuery.data.habits.filter(
              (habit) => habit.status === status,
            );
            return (
              <View
                key={status}
                className="flex-1 rounded-3xl bg-[#e7ebe4] p-3"
              >
                <View className="mb-3 flex-row items-center justify-between px-2">
                  <Text className="text-lg font-semibold capitalize">
                    {status}
                  </Text>
                  <View className="h-7 min-w-7 items-center justify-center rounded-full bg-white px-2">
                    <Text className="text-sm">{habits.length}</Text>
                  </View>
                </View>
                <View className="gap-3">
                  {status === "backlog" ? (
                    <Link href="/habits/new" asChild>
                      <Pressable className="min-h-11 items-center justify-center rounded-2xl border border-dashed border-[#1f6b45]">
                        <Text className="font-semibold text-[#1f6b45]">
                          New habit
                        </Text>
                      </Pressable>
                    </Link>
                  ) : null}
                  {habits.map((habit) => (
                    <BoardCard
                      key={habit.id}
                      error={
                        startMutation.variables === habit.id
                          ? startMutation.error?.message
                          : undefined
                      }
                      habit={habit}
                      isPending={
                        startMutation.isPending &&
                        startMutation.variables === habit.id
                      }
                      lifeArea={habitsQuery.data.lifeAreas.find(
                        (lifeArea) => lifeArea.id === habit.lifeAreaId,
                      )}
                      onStart={() => startMutation.mutate(habit.id)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </AppShell>
  );
}

function BoardCard({
  habit,
  lifeArea,
  isPending,
  error,
  onStart,
}: {
  habit: Habit;
  lifeArea: LifeArea | undefined;
  isPending: boolean;
  error?: string;
  onStart: () => void;
}) {
  const router = useRouter();
  const areaName = LIFE_AREA_NAMES[habit.lifeAreaId];
  const areaFull = lifeArea ? lifeArea.slotsUsed >= lifeArea.slotLimit : true;
  const rateLabel = formatRate(habit.completionRate);

  return (
    <View className="gap-2 rounded-2xl bg-white p-4">
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(`/habits/${habit.id}`)}
      >
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-base font-semibold">{habit.name}</Text>
          <View className="rounded-full bg-[#f3f4f1] px-2 py-0.5">
            <Text className="text-xs text-muted">{areaName}</Text>
          </View>
        </View>
      </Pressable>

      {habit.status === "backlog" ? (
        <>
          <Text className="text-sm">
            <Text className="text-sm font-semibold">Why: </Text>
            {habit.why}
          </Text>
          {areaFull ? (
            <View className="min-h-11 items-center justify-center rounded-xl border border-dashed border-[#d7d7d2] px-3">
              <Text className="text-sm text-muted">⊘ {areaName} is full</Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              className="min-h-11 items-center justify-center rounded-xl border border-[#1f6b45]"
              disabled={isPending}
              onPress={onStart}
            >
              <Text className="font-semibold text-[#1f6b45]">
                {isPending ? "Starting…" : "Start establishing"}
              </Text>
            </Pressable>
          )}
          {error ? (
            <Text className="text-sm text-destructive">{error}</Text>
          ) : null}
        </>
      ) : null}

      {habit.status === "establishing" ? (
        <>
          <Text className="text-sm text-muted">{habit.trigger}</Text>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-sm">
              Day {habit.establishingDay ?? 1} of {ESTABLISHMENT_WINDOW_DAYS}
            </Text>
            <Text className="text-sm">
              <Text
                className={cn(
                  "text-sm font-semibold",
                  (habit.completionRate ?? 0) >=
                    ESTABLISHMENT_COMPLETION_THRESHOLD
                    ? "text-[#1f6b45]"
                    : "text-foreground",
                )}
              >
                {habit.completionRate === null
                  ? "No check-ins yet"
                  : `${rateLabel} done`}
              </Text>
              <Text className="text-sm text-muted">
                {" "}
                · target {Math.round(ESTABLISHMENT_COMPLETION_THRESHOLD * 100)}%
              </Text>
            </Text>
          </View>
          <RateBar rate={habit.completionRate} />
          <Text className="text-sm text-muted">
            {habit.windowCounts.completed} done · {habit.windowCounts.failed}{" "}
            failed · {habit.windowCounts.skipped} skipped
          </Text>
        </>
      ) : null}

      {habit.status === "established" ? (
        <>
          <Text className="text-sm text-[#1f6b45]">
            ✓ Established{" "}
            {habit.establishedAt
              ? formatEstablishedDate(habit.establishedAt)
              : ""}
          </Text>
          <Text className="text-sm text-muted">
            {rateLabel} over {ESTABLISHMENT_WINDOW_DAYS} days · history kept
          </Text>
        </>
      ) : null}
    </View>
  );
}

function RateBar({ rate }: { rate: number | null }) {
  return (
    <View className="relative h-2 justify-center rounded-full bg-[#e6ebe4]">
      <View
        className="h-2 rounded-full bg-[#1f6b45]"
        style={{ width: `${Math.round((rate ?? 0) * 100)}%` }}
      />
      <View
        className="absolute h-4 w-0.5 bg-[#1f6b45]"
        style={{ left: `${ESTABLISHMENT_COMPLETION_THRESHOLD * 100}%` }}
      />
    </View>
  );
}
