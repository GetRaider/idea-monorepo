"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@repo/ui";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

import { USER_PREFERENCES_KEY, useUserPreferences } from "./use-calendar-enabled";

export function CalendarModuleSettings() {
  const queryClient = useQueryClient();
  const preferences = useUserPreferences();
  const update = useMutation({
    mutationFn: (calendarEnabled: boolean) =>
      todexClient.preferences.update({ calendarEnabled }),
    onSuccess: (data) => {
      queryClient.setQueryData(USER_PREFERENCES_KEY, data);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not update Calendar",
      ),
  });
  const checked = preferences.data?.calendarEnabled === true;

  return (
    <section className="mt-6 max-w-lg rounded-xl border border-border p-4">
      <h2 className="text-sm font-medium">Calendar</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Calendar stays out of the sidebar until you enable it.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <Checkbox
          checked={checked}
          disabled={preferences.isPending || update.isPending}
          onCheckedChange={(value) => update.mutate(value === true)}
        />
        Show Calendar
      </label>
    </section>
  );
}
