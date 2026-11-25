import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { Check, X } from "lucide-react-native";

import {
  LIFE_AREA_NAMES,
  SKIP_REASONS,
  type CheckInStatus,
  type Habit,
  type LifeArea,
  type SkipReason,
  type TodayCheckpoint,
} from "@repo/evolin-shared";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";

import { SKIP_REASON_LABELS } from "./constants";

export function CheckInSheet({
  habit,
  lifeArea,
  checkpoint,
  isPending,
  onClose,
  onSave,
}: CheckInSheetProps) {
  const [status, setStatus] = useState<CheckInStatus | null>(
    checkpoint.status === "open" ? null : checkpoint.status,
  );
  const [skipReason, setSkipReason] = useState<SkipReason | null>(
    checkpoint.skipReason,
  );
  const [note, setNote] = useState(checkpoint.note ?? "");
  const missingReason = status === "skipped" && !skipReason;
  const saveDisabled = isPending || status === null || missingReason;
  const areaName = lifeArea ? LIFE_AREA_NAMES[lifeArea.id] : "Life area";

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss check-in"
        className="flex-1 items-center justify-center bg-black/30 px-4"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-[520px] gap-5 rounded-3xl bg-white p-6 shadow-xl"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-2xl font-bold">{habit.name}</Text>
              <Text className="text-sm text-muted">
                {areaName} · Checkpoint {checkpoint.index + 1} of{" "}
                {habit.checkpointsPerDay} · Today
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              className="h-11 w-11 items-center justify-center rounded-full"
              onPress={onClose}
            >
              <X color="#5f675f" size={18} />
            </Pressable>
          </View>

          <View className="rounded-2xl bg-[#f3f4f1] px-4 py-3">
            <Text>
              <Text className="font-semibold">Counts as done: </Text>
              {habit.acceptanceCriteria}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="font-semibold">What happened?</Text>
            <View className="flex-row gap-3">
              <StatusChoice
                label="Completed"
                selected={status === "completed"}
                tone="completed"
                onPress={() => {
                  setStatus("completed");
                  setSkipReason(null);
                }}
              />
              <StatusChoice
                label="Failed"
                selected={status === "failed"}
                tone="failed"
                onPress={() => {
                  setStatus("failed");
                  setSkipReason(null);
                }}
              />
              <StatusChoice
                label="Skipped"
                selected={status === "skipped"}
                tone="skipped"
                onPress={() => setStatus("skipped")}
              />
            </View>
          </View>

          {status === "skipped" ? (
            <View className="gap-3">
              <Text>
                <Text className="font-semibold">Why skipped? </Text>
                <Text className="font-semibold text-[#c4544a]">Required</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SKIP_REASONS.map((reason) => {
                  const selected = skipReason === reason;
                  return (
                    <Pressable
                      key={reason}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className={cn(
                        "min-h-11 items-center justify-center rounded-full border px-4",
                        selected
                          ? "border-[#1f6b45] bg-[#e7f2ea]"
                          : "border-[#d9d9d4] bg-white",
                      )}
                      onPress={() => setSkipReason(reason)}
                    >
                      <Text>{SKIP_REASON_LABELS[reason]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-sm text-muted">Add a note (optional)</Text>
              <TextInput
                accessibilityLabel="Optional note"
                className="min-h-12 rounded-xl border border-[#e4e4df] px-3 text-base text-foreground"
                maxLength={500}
                placeholder="e.g. Took the day off for a trip"
                placeholderTextColor="#8b928c"
                value={note}
                onChangeText={setNote}
              />
              {missingReason ? (
                <Text className="text-sm text-[#c4544a]">
                  ⓘ Choose a reason to skip this checkpoint.
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-[#d9d9d4] bg-white"
              onPress={onClose}
            >
              <Text className="font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saveDisabled }}
              className={cn(
                "min-h-12 flex-1 items-center justify-center rounded-xl",
                saveDisabled ? "bg-[#eceeea]" : "bg-[#1f6b45]",
              )}
              disabled={saveDisabled}
              onPress={() => {
                if (!status || missingReason) return;
                onSave({
                  status,
                  skipReason: status === "skipped" ? skipReason : null,
                  note: note.trim() ? note.trim() : null,
                });
              }}
            >
              <Text
                className={cn(
                  "font-semibold",
                  saveDisabled ? "text-[#a3aaa4]" : "text-white",
                )}
              >
                {isPending ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StatusChoice({
  label,
  selected,
  tone,
  onPress,
}: {
  label: string;
  selected: boolean;
  tone: "completed" | "failed" | "skipped";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "min-h-[88px] flex-1 items-center justify-center gap-2 rounded-2xl border",
        selected && tone === "skipped"
          ? "border-[#e4d3a4] bg-[#fbf6ea]"
          : "border-[#e4e4df] bg-white",
        selected && tone === "completed" ? "border-[#1f6b45] bg-[#e7f2ea]" : "",
        selected && tone === "failed" ? "border-[#e4b2aa] bg-[#fdf4f2]" : "",
      )}
      onPress={onPress}
    >
      {tone === "completed" ? <Check color="#1f6b45" size={18} /> : null}
      {tone === "failed" ? <X color="#c4544a" size={18} /> : null}
      {tone === "skipped" ? <Text className="text-[#b08a3e]">»</Text> : null}
      <Text className="text-sm font-medium">{label}</Text>
    </Pressable>
  );
}

type CheckInSheetProps = {
  habit: Habit;
  lifeArea: LifeArea | undefined;
  checkpoint: TodayCheckpoint;
  isPending: boolean;
  onClose: () => void;
  onSave: (input: {
    status: CheckInStatus;
    skipReason: SkipReason | null;
    note: string | null;
  }) => void;
};
