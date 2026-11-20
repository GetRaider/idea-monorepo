import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import type {
  Habit,
  HabitProgress,
  RecentPracticeDay,
} from '@repo/evolin-shared';

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Separator,
  Text,
} from '@/components/ui';
import {
  CATEGORY_LABELS,
  ConfirmDialog,
  PracticeActions,
  STATUS_LABELS,
  WEEKDAYS,
} from '@/features/habits';
import { ApiClientError } from '@/lib/api/client';
import {
  deleteHabit,
  getHabit,
  getRequestContext,
  transitionHabit,
  type HabitAction,
} from '@/lib/api/habits';
import { cn } from '@/lib/utils';

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogName>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const habitQuery = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => getHabit(habitId),
    enabled: Boolean(habitId),
  });
  const transitionMutation = useMutation({
    mutationFn: (action: HabitAction) => transitionHabit(habitId, action),
    onSuccess: () => {
      setDialog(null);
      setAcknowledged(false);
      void habitQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => void habitQuery.refetch(),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteHabit(habitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      router.replace('/');
    },
  });

  if (habitQuery.isLoading) return <DetailSkeleton />;

  if (habitQuery.error instanceof ApiClientError) {
    if (habitQuery.error.statusCode === 404) {
      return (
        <CenteredMessage
          title="This habit is gone."
          action={<Link href="/">Back to habits</Link>}
        />
      );
    }

    return (
      <CenteredMessage
        title="Could not reach Evolin API."
        action={
          <Button onPress={() => void habitQuery.refetch()}>Retry</Button>
        }
      />
    );
  }

  if (!habitQuery.data) return null;

  const { habit, capacity, progress } = habitQuery.data;
  const { date } = getRequestContext();
  const canPracticeToday =
    habit.status === 'establishing' &&
    (habit.scheduledToday || habit.todayPractice !== null);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6"
    >
      <View className="w-full max-w-[720px] gap-5">
        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-3xl font-bold">{habit.title}</Text>
            <Badge>{STATUS_LABELS[habit.status]}</Badge>
          </View>
          <Text className="text-muted">{CATEGORY_LABELS[habit.category]}</Text>
          {habit.description ? <Text>{habit.description}</Text> : null}
        </View>

        <StatusActions
          habit={habit}
          capacityFull={capacity.used >= capacity.maximum}
          isPending={transitionMutation.isPending}
          pendingAction={transitionMutation.variables}
          onAction={(action) => transitionMutation.mutate(action)}
          onDialog={setDialog}
        />

        {transitionMutation.error ? (
          <Card className="border-destructive">
            <Text className="text-destructive">
              {transitionMutation.error.message}
            </Text>
          </Card>
        ) : null}

        <PlanSummary habit={habit} />

        {canPracticeToday ? (
          <Card>
            <Text className="text-lg font-semibold">Today</Text>
            <PracticeActions
              habitId={habit.id}
              date={date}
              outcome={habit.todayPractice?.outcome ?? null}
            />
          </Card>
        ) : null}

        <ProgressSummary progress={progress} />

        {habit.status === 'established' ? (
          <Card>
            <Text>
              Practice history is kept. This habit no longer uses an active
              slot.
            </Text>
          </Card>
        ) : null}

        <Link href={`/habits/${habit.id}/edit`} asChild>
          <Button variant="outline">Edit habit</Button>
        </Link>
        <Button variant="ghost" onPress={() => setDialog('delete')}>
          <Text className="font-semibold text-destructive">Delete habit</Text>
        </Button>
      </View>

      <ConfirmDialog
        open={dialog === 'backlog'}
        title={`Move "${habit.title}" to the backlog?`}
        description="Practice history stays. It will not use an active slot."
        confirmLabel="Move to backlog"
        isPending={transitionMutation.isPending}
        onOpenChange={(open) => setDialog(open ? 'backlog' : null)}
        onConfirm={() => transitionMutation.mutate('backlog')}
      />

      <ConfirmDialog
        open={dialog === 'delete'}
        title={`Delete "${habit.title}"?`}
        description="Practice history is removed."
        confirmLabel="Delete habit"
        destructive
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => setDialog(open ? 'delete' : null)}
        onConfirm={() => deleteMutation.mutate()}
      />

      <ConfirmDialog
        open={dialog === 'graduate'}
        title="Mark this habit established?"
        description="Graduate when the minimum action feels sustainable without this list. Evolin does not require a number of days."
        confirmLabel="Mark established"
        confirmDisabled={!acknowledged}
        isPending={transitionMutation.isPending}
        onOpenChange={(open) => {
          setDialog(open ? 'graduate' : null);
          if (!open) setAcknowledged(false);
        }}
        onConfirm={() => transitionMutation.mutate('graduate')}
      >
        <View className="mt-4 gap-3">
          <PlanFacts habit={habit} />
          <Separator />
          <Text>Establishing days: {progress.establishingDayCount}</Text>
          <Text>Completed: {progress.completedCount}</Text>
          <Text>Skipped: {progress.skippedCount}</Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
            className="flex-row items-start gap-3"
            onPress={() => setAcknowledged((current) => !current)}
          >
            <Checkbox
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
            />
            <Text className="flex-1">
              I can keep doing the minimum action without tracking it here.
            </Text>
          </Pressable>
        </View>
      </ConfirmDialog>
    </ScrollView>
  );
}

function StatusActions({
  habit,
  capacityFull,
  isPending,
  pendingAction,
  onAction,
  onDialog,
}: StatusActionsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {habit.status === 'backlog' ? (
        <Button
          disabled={capacityFull || (isPending && pendingAction === 'activate')}
          onPress={() => onAction('activate')}
        >
          {isPending && pendingAction === 'activate'
            ? 'Starting…'
            : 'Activate'}
        </Button>
      ) : null}
      {habit.status === 'establishing' ? (
        <>
          <Button
            variant="outline"
            disabled={isPending && pendingAction === 'pause'}
            onPress={() => onAction('pause')}
          >
            {isPending && pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
          </Button>
          <Button variant="outline" onPress={() => onDialog('backlog')}>
            Move to backlog
          </Button>
          <Button onPress={() => onDialog('graduate')}>
            Mark established
          </Button>
        </>
      ) : null}
      {habit.status === 'paused' ? (
        <>
          <Button
            disabled={capacityFull || (isPending && pendingAction === 'resume')}
            onPress={() => onAction('resume')}
          >
            {isPending && pendingAction === 'resume' ? 'Resuming…' : 'Resume'}
          </Button>
          <Button variant="outline" onPress={() => onDialog('backlog')}>
            Move to backlog
          </Button>
        </>
      ) : null}
    </View>
  );
}

function PlanSummary({ habit }: { habit: Habit }) {
  const complete = habit.why && habit.minimumAction && habit.trigger;

  return (
    <Card className="gap-3">
      <Text className="text-xl font-bold">Plan</Text>
      {complete ? (
        <PlanFacts habit={habit} />
      ) : (
        <View className="gap-2">
          <Text>Add a plan before starting.</Text>
          <Link href={`/habits/${habit.id}/edit`}>Add a plan</Link>
        </View>
      )}
    </Card>
  );
}

function PlanFacts({ habit }: { habit: Habit }) {
  const weekdayLabels =
    habit.weekdays
      ?.map(
        (weekday) =>
          WEEKDAYS.find((candidate) => candidate.value === weekday)?.shortLabel,
      )
      .filter(Boolean)
      .join(', ') ?? 'Not set';

  return (
    <View className="gap-2">
      <Text>
        <Text className="font-semibold">Why: </Text>
        {habit.why ?? 'Not set'}
      </Text>
      <Text>
        <Text className="font-semibold">Minimum action: </Text>
        {habit.minimumAction ?? 'Not set'}
      </Text>
      <Text>
        <Text className="font-semibold">Trigger: </Text>
        {habit.trigger ?? 'Not set'}
      </Text>
      <Text>
        <Text className="font-semibold">Schedule: </Text>
        {weekdayLabels}
      </Text>
      <Text>
        <Text className="font-semibold">Duration: </Text>
        {habit.estimatedDurationMinutes
          ? `${habit.estimatedDurationMinutes} minutes`
          : 'Not set'}
      </Text>
    </View>
  );
}

function ProgressSummary({ progress }: { progress: HabitProgress }) {
  return (
    <Card className="gap-4">
      <Text className="text-xl font-bold">Practice</Text>
      <View className="flex-row gap-6">
        <Text>Establishing days: {progress.establishingDayCount}</Text>
        <Text>Completed: {progress.completedCount}</Text>
        <Text>Skipped: {progress.skippedCount}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {progress.recent.map((day) => (
          <RecentDay key={day.date} day={day} />
        ))}
      </View>
      <Text className="text-sm text-muted">
        Filled is completed, outlined is skipped, dot is unmarked. A stored mark
        stays after the schedule changes. Empty means no row and not an unmarked
        establishing day.
      </Text>
    </Card>
  );
}

function RecentDay({ day }: { day: RecentPracticeDay }) {
  const dayClassName = resolveRecentDayClassName(day);
  return (
    <View className="items-center gap-1">
      <View className={cn('h-7 w-7 rounded-full', dayClassName)} />
      <Text className="text-[10px] text-muted">{day.date.slice(5)}</Text>
    </View>
  );
}

function resolveRecentDayClassName(day: RecentPracticeDay): string {
  if (day.outcome === 'completed') return 'bg-accent';
  if (day.outcome === 'skipped') return 'border-2 border-accent bg-card';
  if (day.duringEstablishing && day.inSchedule) {
    return 'items-center justify-center bg-gray-300';
  }
  return 'border border-border bg-transparent';
}

function DetailSkeleton() {
  return (
    <View className="flex-1 items-center bg-background px-4 py-6">
      <View className="w-full max-w-[720px] gap-4">
        <View className="h-10 animate-pulse rounded-xl bg-gray-200" />
        <View className="h-40 animate-pulse rounded-2xl bg-gray-200" />
        <View className="h-48 animate-pulse rounded-2xl bg-gray-200" />
      </View>
    </View>
  );
}

function CenteredMessage({
  title,
  action,
}: {
  title: string;
  action: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-4">
      <Text className="text-xl font-semibold">{title}</Text>
      {action}
    </View>
  );
}

type DialogName = 'backlog' | 'delete' | 'graduate' | null;

type StatusActionsProps = {
  habit: Habit;
  capacityFull: boolean;
  isPending: boolean;
  pendingAction?: HabitAction;
  onAction: (action: HabitAction) => void;
  onDialog: (dialog: DialogName) => void;
};
