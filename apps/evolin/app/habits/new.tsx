import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { HabitForm, type HabitFormPayload } from '@/features/habits';
import { createHabit, listHabits } from '@/lib/api/habits';

export default function NewHabitScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: listHabits,
  });
  const createMutation = useMutation({
    mutationFn: ({
      values,
      startEstablishing,
    }: {
      values: HabitFormPayload;
      startEstablishing: boolean;
    }) => createHabit({ ...values, startEstablishing }),
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
        <HabitForm
          mode="create"
          capacityFull={(habitsQuery.data?.capacity.used ?? 0) >= 3}
          isPending={createMutation.isPending}
          serverError={createMutation.error?.message}
          onSubmit={(values, startEstablishing) =>
            createMutation.mutate({ values, startEstablishing })
          }
        />
      </View>
    </ScrollView>
  );
}
