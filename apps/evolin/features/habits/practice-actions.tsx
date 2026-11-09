import { useMutation, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import type { PracticeOutcome } from '@repo/evolin-shared';

import { Button, Text } from '@/components/ui';
import {
  deletePractice,
  putPractice,
} from '@/lib/api/habits';

export function PracticeActions({
  habitId,
  date,
  outcome,
}: PracticeActionsProps) {
  const queryClient = useQueryClient();
  const practiceMutation = useMutation({
    mutationFn: (nextOutcome: PracticeOutcome) =>
      putPractice(habitId, date, nextOutcome),
    onSuccess: invalidateHabits,
  });
  const undoMutation = useMutation({
    mutationFn: () => deletePractice(habitId, date),
    onSuccess: invalidateHabits,
  });

  function invalidateHabits() {
    void queryClient.invalidateQueries({ queryKey: ['habits'] });
    void queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
  }

  if (outcome) {
    const alternative = outcome === 'completed' ? 'skipped' : 'completed';
    return (
      <View className="mt-3 gap-2">
        <Text className="font-semibold">
          {outcome === 'completed' ? 'Completed' : 'Skipped'}
        </Text>
        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            variant="outline"
            onPress={() => practiceMutation.mutate(alternative)}
          >
            {practiceMutation.isPending
              ? 'Saving…'
              : alternative === 'completed'
                ? 'Mark completed'
                : 'Change to skip'}
          </Button>
          <Button
            accessibilityLabel="Undo practice"
            variant="ghost"
            disabled={undoMutation.isPending}
            onPress={() => undoMutation.mutate()}
          >
            {undoMutation.isPending ? 'Undoing…' : 'Undo'}
          </Button>
        </View>
        {practiceMutation.error || undoMutation.error ? (
          <Text className="text-sm text-destructive">
            {(practiceMutation.error ?? undoMutation.error)?.message}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mt-3 gap-2">
      <View className="flex-row gap-2">
        <Button
          accessibilityLabel="Mark completed"
          className="flex-1"
          disabled={
            practiceMutation.isPending &&
            practiceMutation.variables === 'completed'
          }
          onPress={() => practiceMutation.mutate('completed')}
        >
          {practiceMutation.isPending &&
          practiceMutation.variables === 'completed'
            ? 'Saving…'
            : 'Done'}
        </Button>
        <Button
          accessibilityLabel="Skip today"
          className="flex-1"
          variant="outline"
          disabled={
            practiceMutation.isPending &&
            practiceMutation.variables === 'skipped'
          }
          onPress={() => practiceMutation.mutate('skipped')}
        >
          {practiceMutation.isPending &&
          practiceMutation.variables === 'skipped'
            ? 'Saving…'
            : 'Skip'}
        </Button>
      </View>
      {practiceMutation.error ? (
        <Text className="text-sm text-destructive">
          {practiceMutation.error.message}
        </Text>
      ) : null}
    </View>
  );
}

type PracticeActionsProps = {
  habitId: string;
  date: string;
  outcome: PracticeOutcome | null;
};
