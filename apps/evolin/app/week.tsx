import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  LIFE_AREA_IDS,
  LIFE_AREA_NAMES,
  addDays,
  type WeekCellState,
  type WeekHabit,
} from "@repo/evolin-shared";

import { Button, Text } from "@/components/ui";
import {
  AppShell,
  formatDayNumber,
  formatWeekday,
} from "@/features/habits/app-shell";
import { DayRing, Mark, StreakChip } from "@/features/habits/marks";
import { getRequestContext, getWeek } from "@/lib/api/habits";

export default function WeekScreen() {
  const today = getRequestContext().date;
  const [anchorDate, setAnchorDate] = useState(today);
  const weekQuery = useQuery({
    queryKey: ["week", anchorDate],
    queryFn: () => getWeek(anchorDate),
  });
  const habits = weekQuery.data?.habits ?? [];
  const days = weekQuery.data?.days ?? [];

  return (
    <AppShell current="week" width="max-w-[1100px]">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-4xl font-bold">Week</Text>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            className="min-h-11 items-center justify-center rounded-full bg-white px-4"
            onPress={() => setAnchorDate((current) => addDays(current, -7))}
          >
            <Text>Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: anchorDate >= today }}
            className="min-h-11 items-center justify-center rounded-full bg-white px-4"
            disabled={anchorDate >= today}
            onPress={() =>
              setAnchorDate((current) => {
                const next = addDays(current, 7);
                return next > today ? today : next;
              })
            }
          >
            <Text className={anchorDate >= today ? "text-muted" : ""}>
              Next
            </Text>
          </Pressable>
        </View>
      </View>

      {weekQuery.isError ? (
        <View className="mt-6 gap-3">
          <Text className="font-semibold">Could not reach Evolin API.</Text>
          <Button variant="outline" onPress={() => void weekQuery.refetch()}>
            Retry
          </Button>
        </View>
      ) : null}

      {weekQuery.data ? (
        <View className="mt-6 gap-6">
          <View className="flex-row items-end">
            <View className="flex-1" />
            {days.map((day) => (
              <View key={day.date} className="w-14 items-center gap-2">
                <Text className="text-xs text-muted">
                  {formatWeekday(day.date)}
                </Text>
                <Text
                  className={day.date === today ? "font-bold" : "font-semibold"}
                >
                  {formatDayNumber(day.date)}
                </Text>
                <DayRing progress={dayProgress(habits, day.date)} />
              </View>
            ))}
          </View>

          {LIFE_AREA_IDS.map((lifeAreaId) => {
            const areaHabits = habits.filter(
              (habit) => habit.lifeAreaId === lifeAreaId,
            );
            if (areaHabits.length === 0) return null;
            return (
              <View key={lifeAreaId} className="gap-2">
                <Text className="text-sm font-semibold text-muted">
                  {LIFE_AREA_NAMES[lifeAreaId]} {areaHabits.length}
                </Text>
                {areaHabits.map((habit) => (
                  <HabitWeekRow key={habit.id} habit={habit} />
                ))}
              </View>
            );
          })}

          {habits.length === 0 ? (
            <Text className="text-muted">
              Habits show up here once you start establishing them.
            </Text>
          ) : null}
        </View>
      ) : null}
    </AppShell>
  );
}

function HabitWeekRow({ habit }: { habit: WeekHabit }) {
  return (
    <View className="flex-row items-center rounded-2xl bg-white px-3 py-3">
      <View className="flex-1 gap-1 pr-3">
        <Text className="font-semibold">{habit.name}</Text>
        <StreakChip days={habit.streak} />
      </View>
      {habit.days.map((day) => (
        <View key={day.date} className="w-14 items-center">
          <WeekCell state={day.state} />
        </View>
      ))}
    </View>
  );
}

function WeekCell({ state }: { state: WeekCellState }) {
  if (state === "off") return <View className="h-8 w-8" />;
  if (state === "partial") return <DayRing progress={0.5} />;
  return <Mark kind={state} size="week" />;
}

function dayProgress(habits: WeekHabit[], date: string): number | null {
  const cells = habits.flatMap((habit) =>
    habit.days.filter((day) => day.date === date && day.state !== "off"),
  );
  if (cells.length === 0) return null;
  const completed = cells.filter((cell) => cell.state === "completed").length;
  return completed / cells.length;
}
