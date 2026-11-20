import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { z } from 'zod';

import {
  HABIT_CATEGORIES,
  isPlanComplete,
  type HabitCategory,
} from '@repo/evolin-shared';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/utils';

import { CATEGORY_LABELS, WEEKDAYS } from './constants';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(80),
  description: z.string().trim().max(500),
  category: z.enum(HABIT_CATEGORIES),
  why: z.string().trim().max(500),
  minimumAction: z.string().trim().max(200),
  trigger: z.string().trim().max(200),
  weekdays: z.array(z.number().int().min(1).max(7)),
  estimatedDurationMinutes: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        (Number.isInteger(Number(value)) &&
          Number(value) >= 1 &&
          Number(value) <= 180),
      'Enter a whole number from 1 to 180.',
    ),
});

export function HabitForm({
  initialValues,
  mode,
  capacityFull,
  serverError,
  isPending,
  onSubmit,
}: HabitFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues ?? EMPTY_FORM,
  });
  const values = watch();
  const planComplete = isPlanComplete({
    why: emptyToNull(values.why),
    minimumAction: emptyToNull(values.minimumAction),
    trigger: emptyToNull(values.trigger),
    weekdays: values.weekdays.length > 0 ? values.weekdays : null,
    estimatedDurationMinutes: values.estimatedDurationMinutes
      ? Number(values.estimatedDurationMinutes)
      : null,
  });

  function submit(startEstablishing: boolean) {
    void handleSubmit((formValues) =>
      onSubmit(toPayload(formValues), startEstablishing),
    )();
  }

  return (
    <View className="gap-5">
      <FormField label="Title" error={errors.title?.message}>
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              autoFocus={mode === 'create'}
              maxLength={80}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Description (optional)" error={errors.description?.message}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Textarea
              maxLength={500}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Category" error={errors.category?.message}>
        <Controller
          control={control}
          name="category"
          render={({ field }) => {
            const selectedOption = {
              value: field.value,
              label: CATEGORY_LABELS[field.value],
            };

            return (
              <Select
                value={selectedOption}
                onValueChange={(option) => {
                  if (option?.value) field.onChange(option.value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category}
                      label={CATEGORY_LABELS[category]}
                      value={category}
                    />
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
      </FormField>

      <FormField label="Why" error={errors.why?.message}>
        <Controller
          control={control}
          name="why"
          render={({ field }) => (
            <Textarea
              maxLength={500}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Minimum action" error={errors.minimumAction?.message}>
        <Controller
          control={control}
          name="minimumAction"
          render={({ field }) => (
            <Input
              maxLength={200}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField
        label="Trigger"
        hint="Something you already do."
        error={errors.trigger?.message}
      >
        <Controller
          control={control}
          name="trigger"
          render={({ field }) => (
            <Input
              maxLength={200}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Schedule" error={errors.weekdays?.message}>
        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {WEEKDAYS.map((weekday) => {
                const checked = field.value.includes(weekday.value);
                return (
                  <Pressable
                    key={weekday.value}
                    accessibilityLabel={weekday.label}
                    accessibilityRole="button"
                    accessibilityState={{ checked }}
                    className={cn(
                      'min-h-11 min-w-14 items-center justify-center rounded-xl border px-3',
                      checked
                        ? 'border-accent bg-accent'
                        : 'border-border bg-card',
                    )}
                    onPress={() =>
                      field.onChange(
                        checked
                          ? field.value.filter(
                              (value) => value !== weekday.value,
                            )
                          : [...field.value, weekday.value].sort(),
                      )
                    }
                  >
                    <Text
                      className={checked ? 'text-white' : 'text-foreground'}
                    >
                      {weekday.shortLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </FormField>

      <FormField
        label="Estimated duration (minutes)"
        error={errors.estimatedDurationMinutes?.message}
      >
        <Controller
          control={control}
          name="estimatedDurationMinutes"
          render={({ field }) => (
            <Input
              inputMode="numeric"
              keyboardType="number-pad"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      {serverError ? (
        <Text className="text-destructive">{serverError}</Text>
      ) : null}

      {mode === 'create' ? (
        <View className="gap-3 md:flex-row">
          <Button
            className="flex-1"
            variant="outline"
            disabled={isPending}
            onPress={() => submit(false)}
          >
            {isPending ? 'Saving…' : 'Save to backlog'}
          </Button>
          <Button
            className="flex-1"
            disabled={isPending || !planComplete || capacityFull}
            onPress={() => submit(true)}
          >
            {isPending ? 'Saving…' : 'Start establishing'}
          </Button>
          {capacityFull ? (
            <Text className="text-sm text-muted">
              All 3 slots are in use. Pause or graduate a habit before starting
              another.
            </Text>
          ) : null}
        </View>
      ) : (
        <Button disabled={isPending} onPress={() => submit(false)}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      )}
    </View>
  );
}

function FormField({ label, hint, error, children }: FormFieldProps) {
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      {hint ? <Text className="text-sm text-muted">{hint}</Text> : null}
      {children}
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
}

function toPayload(values: HabitFormValues): HabitFormPayload {
  return {
    title: values.title.trim(),
    description: emptyToNull(values.description),
    category: values.category,
    why: emptyToNull(values.why),
    minimumAction: emptyToNull(values.minimumAction),
    trigger: emptyToNull(values.trigger),
    weekdays: values.weekdays.length > 0 ? values.weekdays : null,
    estimatedDurationMinutes: values.estimatedDurationMinutes
      ? Number(values.estimatedDurationMinutes)
      : null,
  };
}

function emptyToNull(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

const EMPTY_FORM: HabitFormValues = {
  title: '',
  description: '',
  category: 'health',
  why: '',
  minimumAction: '',
  trigger: '',
  weekdays: [],
  estimatedDurationMinutes: '',
};

export type HabitFormPayload = {
  title: string;
  description: string | null;
  category: HabitCategory;
  why: string | null;
  minimumAction: string | null;
  trigger: string | null;
  weekdays: number[] | null;
  estimatedDurationMinutes: number | null;
};

export type HabitFormValues = {
  title: string;
  description: string;
  category: HabitCategory;
  why: string;
  minimumAction: string;
  trigger: string;
  weekdays: number[];
  estimatedDurationMinutes: string;
};

type HabitFormProps = {
  initialValues?: HabitFormValues;
  mode: 'create' | 'edit';
  capacityFull: boolean;
  serverError?: string;
  isPending: boolean;
  onSubmit: (
    values: HabitFormPayload,
    startEstablishing: boolean,
  ) => void | Promise<void>;
};

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};
