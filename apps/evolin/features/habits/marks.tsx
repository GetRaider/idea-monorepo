import { Check, Flame, X } from "lucide-react-native";
import { View } from "react-native";

import type { TodayCheckpoint } from "@repo/evolin-shared";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";

export function StreakChip({ days }: { days: number }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-[#eef1ee] px-2 py-0.5">
      <Flame color="#8a8478" size={12} />
      <Text className="text-xs text-[#5f675f]">{days} days</Text>
    </View>
  );
}

export function SummaryChip({
  kind,
  label,
}: {
  kind: "completed" | "failed" | "skipped" | "open";
  label: string;
}) {
  return (
    <View className="min-h-8 flex-row items-center gap-1.5">
      <Mark kind={kind} size="sm" />
      <Text className="text-sm text-foreground">{label}</Text>
    </View>
  );
}

export function CheckpointButton({
  checkpoint,
  label,
}: {
  checkpoint: TodayCheckpoint;
  label?: string | null;
}) {
  const kind = checkpoint.status === "open" ? "open" : checkpoint.status;
  return (
    <View className="items-center gap-1">
      <Mark kind={kind} size="lg" />
      {label ? <Text className="text-xs text-muted">{label}</Text> : null}
    </View>
  );
}

export function Mark({
  kind,
  size,
}: {
  kind: "completed" | "failed" | "skipped" | "open" | "partial";
  size: "sm" | "lg" | "week";
}) {
  const dimension =
    size === "lg"
      ? "h-14 w-14 rounded-2xl"
      : size === "week"
        ? "h-8 w-8 rounded-full"
        : "h-5 w-5 rounded-md";
  const iconSize = size === "lg" ? 22 : 14;

  if (kind === "completed") {
    return (
      <View
        className={cn(dimension, "items-center justify-center bg-[#1f6b45]")}
      >
        <Check color="#ffffff" size={iconSize} strokeWidth={2.5} />
      </View>
    );
  }
  if (kind === "failed") {
    return (
      <View
        className={cn(
          dimension,
          "items-center justify-center border border-[#e4b2aa] bg-white",
        )}
      >
        <X color="#c4544a" size={iconSize} strokeWidth={2.5} />
      </View>
    );
  }
  if (kind === "skipped") {
    return (
      <View
        className={cn(
          dimension,
          "items-center justify-center border border-[#e4d3a4] bg-[#fbf6ea]",
        )}
      >
        <Text
          className={
            size === "lg" ? "text-lg text-[#b08a3e]" : "text-xs text-[#b08a3e]"
          }
        >
          »
        </Text>
      </View>
    );
  }
  if (kind === "partial") {
    return (
      <View className={cn(dimension, "border-2 border-[#1f6b45] bg-white")} />
    );
  }
  return <View className={cn(dimension, "border border-[#d7d7d2] bg-white")} />;
}

export function DayRing({ progress }: { progress: number | null }) {
  if (progress !== null && progress >= 1) {
    return <Mark kind="completed" size="week" />;
  }
  if (progress !== null && progress > 0) {
    return (
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{
          backgroundImage: `conic-gradient(#1f6b45 ${Math.round(progress * 360)}deg, #e4e4df 0deg)`,
        }}
      >
        <View className="h-5 w-5 rounded-full bg-background" />
      </View>
    );
  }
  return <View className="h-8 w-8 rounded-full border-2 border-[#e4e4df]" />;
}
