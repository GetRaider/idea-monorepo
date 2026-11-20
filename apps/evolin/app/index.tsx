import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';

import type {
  Capacity,
  Habit,
  HabitStatus,
} from '@repo/evolin-shared';

import { Badge, Button, Card, Text } from '@/components/ui';
import {
  CATEGORY_LABELS,
  PracticeActions,
  STATUS_LABELS,
} from '@/features/habits';
import { getRequestContext, listHabits } from '@/lib/api/habits';

const STATUS_ORDER: HabitStatus[] = [
  'establishing',
  'paused',
  'backlog',
  'established',
];

export default function HabitsScreen() {
  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: listHabits,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="items-center px-4 py-6">
        <View className="w-full max-w-[720px] gap-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-bold">Habits</Text>
            <Link href="/habits/new" asChild>
              <Button>New habit</Button>
            </Link>
          </View>

          {habitsQuery.isLoading ? <ListSkeleton /> : null}
          {habitsQuery.isError ? (
            <Card className="gap-3">
              <Text className="font-semibold">Could not reach Evolin API.</Text>
              <Button
                variant="outline"
                onPress={() => void habitsQuery.refetch()}
              >
                Retry
              </Button>
            </Card>
          ) : null}

          {habitsQuery.data ? (
            <>
              <CapacityIndicator capacity={habitsQuery.data.capacity} />
              {habitsQuery.data.habits.length === 0 ? (
                <EmptyState />
              ) : (
                STATUS_ORDER.map((status) => (
                  <HabitGroup
                    key={status}
                    status={status}
                    habits={habitsQuery.data.habits.filter(
                      (habit) => habit.status === status,
                    )}
                  />
                ))
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CapacityIndicator({ capacity }: { capacity: Capacity }) {
  return (
    <Card className="gap-1">
      <Text className="text-lg font-semibold">
        {capacity.used} of {capacity.maximum} establishing
      </Text>
      {capacity.used === capacity.recommended ? (
        <Text className="text-sm text-muted">
          Two at a time is the recommended load. One more slot is available.
        </Text>
      ) : null}
      {capacity.used === capacity.maximum ? (
        <Text className="text-sm text-muted">
          All 3 slots are in use. Pause or graduate a habit before starting
          another.
        </Text>
      ) : null}
    </Card>
  );
}

function HabitGroup({
  status,
  habits,
}: {
  status: HabitStatus;
  habits: Habit[];
}) {
  if (habits.length === 0) return null;

  return (
    <View className="gap-3">
      <Text className="text-xl font-bold">{STATUS_LABELS[status]}</Text>
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </View>
  );
}

function HabitCard({ habit }: { habit: Habit }) {
  const router = useRouter();
  const { date } = getRequestContext();
  const canPracticeToday =
    habit.status === 'establishing' &&
    (habit.scheduledToday || habit.todayPractice !== null);

  return (
    <Card>
      <Pressable
        accessibilityRole="link"
        className="gap-2"
        onPress={() => router.push(`/habits/${habit.id}`)}
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-lg font-semibold">{habit.title}</Text>
          <Badge>{STATUS_LABELS[habit.status]}</Badge>
        </View>
        <Text className="text-sm text-muted">
          {CATEGORY_LABELS[habit.category]}
        </Text>
        <Text>
          {habit.minimumAction ??
            (habit.status === 'backlog' ? 'No minimum action yet' : '')}
        </Text>
      </Pressable>
      {canPracticeToday ? (
        <PracticeActions
          habitId={habit.id}
          date={date}
          outcome={habit.todayPractice?.outcome ?? null}
        />
      ) : null}
      {habit.status === 'establishing' &&
      !habit.scheduledToday &&
      !habit.todayPractice ? (
        <Text className="mt-3 text-sm text-muted">Not scheduled today</Text>
      ) : null}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="items-start gap-2">
      <Text className="text-xl font-semibold">No habits yet.</Text>
      <Text className="text-muted">Add one you want to establish.</Text>
      <Link href="/habits/new" asChild>
        <Button className="mt-2">New habit</Button>
      </Link>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <View className="gap-3">
      {[1, 2, 3].map((placeholder) => (
        <View
          key={placeholder}
          className="h-32 animate-pulse rounded-2xl bg-gray-200"
        />
      ))}
    </View>
  );
}
