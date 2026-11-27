"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@repo/ui";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

import {
  USER_PREFERENCES_KEY,
  useUserPreferences,
} from "./use-calendar-enabled";

export function CountersModuleSettings() {
  const queryClient = useQueryClient();
  const preferences = useUserPreferences();
  const update = useMutation({
    mutationFn: (countersEnabled: boolean) =>
      todexClient.preferences.update({ countersEnabled }),
    onSuccess: (data) => {
      queryClient.setQueryData(USER_PREFERENCES_KEY, data);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not update Counters",
      ),
  });
  const checked = preferences.data?.countersEnabled === true;

  return (
    <section className="mt-6 max-w-lg rounded-xl border border-border p-4">
      <h2 className="text-sm font-medium">Counters</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Counters stay out of Planning, Today and Tomorrow until you enable them.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <Checkbox
          checked={checked}
          disabled={preferences.isPending || update.isPending}
          onCheckedChange={(value) => update.mutate(value === true)}
        />
        Show Counters
      </label>
    </section>
  );
}
