import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import {
  HabitForm,
  type HabitFormPayload,
  type HabitFormValues,
} from '@/features/habits';
import { getHabit, updateHabit } from '@/lib/api/habits';

export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const habitQuery = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => getHabit(habitId),
  });
  const updateMutation = useMutation({
    mutationFn: (values: HabitFormPayload) => updateHabit(habitId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      void queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      router.back();
    },
  });

  if (habitQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading habit…</Text>
      </View>
    );
  }

  if (!habitQuery.data) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Text>This habit is gone.</Text>
        <Button onPress={() => router.replace('/')}>Back to habits</Button>
      </View>
    );
  }

  const habit = habitQuery.data.habit;
  const initialValues: HabitFormValues = {
    title: habit.title,
    description: habit.description ?? '',
    category: habit.category,
    why: habit.why ?? '',
    minimumAction: habit.minimumAction ?? '',
    trigger: habit.trigger ?? '',
    weekdays: habit.weekdays ?? [],
    estimatedDurationMinutes:
      habit.estimatedDurationMinutes?.toString() ?? '',
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-[720px] gap-5">
        <Text className="text-2xl font-bold">Edit plan</Text>
        <HabitForm
          key={habit.updatedAt}
          initialValues={initialValues}
          mode="edit"
          capacityFull={false}
          isPending={updateMutation.isPending}
          serverError={updateMutation.error?.message}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      </View>
    </ScrollView>
  );
}
