import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { z } from "zod";

import {
  LIFE_AREA_IDS,
  MAX_CHECKPOINTS_PER_DAY,
  type CreateHabitInput,
} from "@repo/evolin-shared";

import { Button, Input, Label, Text, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

import { LIFE_AREA_OPTIONS, WEEKDAYS } from "./constants";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(80),
    lifeAreaId: z.enum(LIFE_AREA_IDS),
    why: z.string().trim().min(1, "Why is required.").max(500),
    trigger: z.string().trim().min(1, "Trigger is required.").max(200),
    acceptanceCriteria: z
      .string()
      .trim()
      .min(1, "Say what counts as done.")
      .max(500),
    checkpointsPerDay: z
      .string()
      .refine(
        (value) =>
          Number.isInteger(Number(value)) &&
          Number(value) >= 1 &&
          Number(value) <= MAX_CHECKPOINTS_PER_DAY,
        `Enter a whole number from 1 to ${MAX_CHECKPOINTS_PER_DAY}.`,
      ),
    checkpointLabels: z.string().trim().max(400),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Pick at least one day."),
  })
  .superRefine((value, context) => {
    const labels = splitLabels(value.checkpointLabels);
    if (
      labels.length > 0 &&
      labels.length !== Number(value.checkpointsPerDay)
    ) {
      context.addIssue({
        code: "custom",
        path: ["checkpointLabels"],
        message: "Use one label per checkpoint, or leave this blank.",
      });
    }
  });

export function HabitForm({
  initialValues,
  mode,
  lifeAreaLocked,
  serverError,
  isPending,
  onSubmit,
}: HabitFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues ?? EMPTY_FORM,
  });

  return (
    <View className="gap-5">
      <FormField label="Name" error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              autoFocus={mode === "create"}
              maxLength={80}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Life area" error={errors.lifeAreaId?.message}>
        <Controller
          control={control}
          name="lifeAreaId"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {LIFE_AREA_OPTIONS.map((lifeArea) => {
                const selected = field.value === lifeArea.value;
                return (
                  <Pressable
                    key={lifeArea.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: lifeAreaLocked }}
                    className={cn(
                      "min-h-11 items-center justify-center rounded-full border px-4",
                      selected
                        ? "border-[#1f6b45] bg-[#e7f2ea]"
                        : "border-border bg-card",
                      lifeAreaLocked && !selected ? "opacity-40" : "",
                    )}
                    disabled={lifeAreaLocked}
                    onPress={() => field.onChange(lifeArea.value)}
                  >
                    <Text
                      className={selected ? "font-semibold text-[#1f6b45]" : ""}
                    >
                      {lifeArea.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
        {lifeAreaLocked ? (
          <Text className="text-sm text-muted">
            Life area stays put once establishing starts.
          </Text>
        ) : null}
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

      <FormField
        label="Trigger"
        hint="A time or a routine you already have."
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

      <FormField
        label="Counts as done"
        hint="What one checkpoint has to be."
        error={errors.acceptanceCriteria?.message}
      >
        <Controller
          control={control}
          name="acceptanceCriteria"
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

      <FormField
        label="Checkpoints per day"
        error={errors.checkpointsPerDay?.message}
      >
        <Controller
          control={control}
          name="checkpointsPerDay"
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

      <FormField
        label="Checkpoint labels (optional)"
        hint="Comma-separated, one per checkpoint."
        error={errors.checkpointLabels?.message}
      >
        <Controller
          control={control}
          name="checkpointLabels"
          render={({ field }) => (
            <Input
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
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    className={cn(
                      "min-h-11 min-w-14 items-center justify-center rounded-xl border px-3",
                      checked
                        ? "border-accent bg-accent"
                        : "border-border bg-card",
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
                      className={checked ? "text-white" : "text-foreground"}
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

      {serverError ? (
        <Text className="text-destructive">{serverError}</Text>
      ) : null}

      <Button
        disabled={isPending}
        onPress={() =>
          void handleSubmit((values) => onSubmit(toPayload(values)))()
        }
      >
        {isPending ? "Saving…" : mode === "create" ? "Save to backlog" : "Save"}
      </Button>
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

function toPayload(values: HabitFormValues): CreateHabitInput {
  const labels = splitLabels(values.checkpointLabels);
  return {
    name: values.name.trim(),
    lifeAreaId: values.lifeAreaId,
    why: values.why.trim(),
    trigger: values.trigger.trim(),
    acceptanceCriteria: values.acceptanceCriteria.trim(),
    checkpointsPerDay: Number(values.checkpointsPerDay),
    checkpointLabels: labels.length > 0 ? labels : null,
    weekdays: [...values.weekdays].sort(),
  };
}

function splitLabels(value: string): string[] {
  return value
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

const EMPTY_FORM: HabitFormValues = {
  name: "",
  lifeAreaId: "health",
  why: "",
  trigger: "",
  acceptanceCriteria: "",
  checkpointsPerDay: "1",
  checkpointLabels: "",
  weekdays: [],
};

export type HabitFormValues = {
  name: string;
  lifeAreaId: (typeof LIFE_AREA_IDS)[number];
  why: string;
  trigger: string;
  acceptanceCriteria: string;
  checkpointsPerDay: string;
  checkpointLabels: string;
  weekdays: number[];
};

type HabitFormProps = {
  initialValues?: HabitFormValues;
  mode: "create" | "edit";
  lifeAreaLocked: boolean;
  serverError?: string;
  isPending: boolean;
  onSubmit: (values: CreateHabitInput) => void | Promise<void>;
};

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};
