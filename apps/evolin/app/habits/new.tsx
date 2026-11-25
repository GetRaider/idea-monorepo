import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import type { CreateHabitInput } from '@repo/evolin-shared';

import { Text } from '@/components/ui';
import { HabitForm } from '@/features/habits';
import { createHabit } from '@/lib/api/habits';

export default function NewHabitScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (values: CreateHabitInput) => createHabit(values),
    onSuccess: ({ habit }) => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      router.replace(`/habits/${habit.id}`);
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-[720px] gap-5">
        <Text className="text-2xl font-bold">Plan a habit</Text>
        <Text className="text-muted">
          It starts in the backlog. Establishing begins from the board when the
          life area has a free slot.
        </Text>
        <HabitForm
          isPending={createMutation.isPending}
          lifeAreaLocked={false}
          mode="create"
          serverError={createMutation.error?.message}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      </View>
    </ScrollView>
  );
}
