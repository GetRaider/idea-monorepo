import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
  ESTABLISHMENT_WINDOW_DAYS,
  LIFE_AREA_NAMES,
} from '@repo/evolin-shared';

import { Badge, Button, Card, Text } from '@/components/ui';
import {
  CHECKPOINT_STATUS_PRESENTATION,
  ConfirmDialog,
  SKIP_REASON_LABELS,
  STATUS_LABELS,
  formatRate,
} from '@/features/habits';
import { ApiClientError } from '@/lib/api/client';
import { deleteHabit, getHabit, startEstablishing } from '@/lib/api/habits';

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const habitQuery = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => getHabit(habitId),
    enabled: Boolean(habitId),
  });
  const startMutation = useMutation({
    mutationFn: () => startEstablishing(habitId),
    onSuccess: () => {
      void habitQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteHabit(habitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      router.replace('/board');
    },
  });

  if (habitQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading habit…</Text>
      </View>
    );
  }

  if (
    habitQuery.error instanceof ApiClientError &&
    habitQuery.error.statusCode === 404
  ) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Text>This habit is gone.</Text>
        <Link href="/board">Back to the board</Link>
      </View>
    );
  }

  if (habitQuery.isError || !habitQuery.data) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Text>Could not reach Evolin API.</Text>
        <Button onPress={() => void habitQuery.refetch()}>Retry</Button>
      </View>
    );
  }

  const { habit, lifeArea, checkIns } = habitQuery.data;
  const areaFull = lifeArea.slotsUsed >= lifeArea.slotLimit;
  const dates = [...new Set(checkIns.map((checkIn) => checkIn.date))];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6"
    >
      <View className="w-full max-w-[720px] gap-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-3xl font-bold">{habit.name}</Text>
            <Text className="text-muted">
              {LIFE_AREA_NAMES[habit.lifeAreaId]}
            </Text>
          </View>
          <Badge>{STATUS_LABELS[habit.status]}</Badge>
        </View>

        <Card className="gap-2">
          <Text>Why: {habit.why}</Text>
          <Text>Trigger: {habit.trigger}</Text>
          <Text>Counts as done: {habit.acceptanceCriteria}</Text>
          <Text>
            {habit.checkpointsPerDay} checkpoint
            {habit.checkpointsPerDay === 1 ? '' : 's'} a day
          </Text>
          {habit.status === 'establishing' ? (
            <Text>
              Day {habit.establishingDay ?? 1} of {ESTABLISHMENT_WINDOW_DAYS} ·{' '}
              {formatRate(habit.completionRate)} · streak {habit.streak}
            </Text>
          ) : null}
          {habit.status === 'established' ? (
            <Text>
              Established{' '}
              {habit.establishedAt
                ? new Date(habit.establishedAt).toLocaleDateString()
                : ''}{' '}
              · {formatRate(habit.completionRate)} · history kept
            </Text>
          ) : null}
        </Card>

        <View className="flex-row flex-wrap gap-3">
          <Link href={`/habits/${habit.id}/edit`} asChild>
            <Button variant="outline">Edit</Button>
          </Link>
          {habit.status === 'backlog' ? (
            <Button
              disabled={startMutation.isPending || areaFull}
              onPress={() => startMutation.mutate()}
            >
              {startMutation.isPending ? 'Starting…' : 'Start establishing'}
            </Button>
          ) : null}
          <Button variant="destructive" onPress={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </View>
        {habit.status === 'backlog' && areaFull ? (
          <Text className="text-sm text-muted">
            {lifeArea.name} is full ({lifeArea.slotsUsed} of{' '}
            {lifeArea.slotLimit} slots used).
          </Text>
        ) : null}
        {startMutation.error ? (
          <Text className="text-destructive">
            {startMutation.error.message}
          </Text>
        ) : null}

        <View className="gap-3">
          <Text className="text-xl font-bold">Practice history</Text>
          {dates.length === 0 ? (
            <Text className="text-muted">No check-ins yet.</Text>
          ) : (
            dates.map((date) => (
              <Card key={date} className="gap-2">
                <Text className="font-semibold">{date}</Text>
                {checkIns
                  .filter((checkIn) => checkIn.date === date)
                  .map((checkIn) => {
                    const presentation =
                      CHECKPOINT_STATUS_PRESENTATION[checkIn.status];
                    return (
                      <Text key={checkIn.id}>
                        {presentation.icon} Checkpoint{' '}
                        {checkIn.checkpointIndex + 1}: {presentation.label}
                        {checkIn.skipReason
                          ? ` · ${SKIP_REASON_LABELS[checkIn.skipReason]}`
                          : ''}
                        {checkIn.note ? ` · ${checkIn.note}` : ''}
                      </Text>
                    );
                  })}
              </Card>
            ))
          )}
        </View>
      </View>
      <ConfirmDialog
        confirmLabel="Delete habit"
        description="The habit and its check-in history are removed."
        destructive
        isPending={deleteMutation.isPending}
        open={confirmDelete}
        title="Delete this habit?"
        onConfirm={() => deleteMutation.mutate()}
        onOpenChange={setConfirmDelete}
      />
    </ScrollView>
  );
}
