"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { pushConnectedGoogleCalendarEvent } from "@/helpers/calendar/google-calendar-sync-actions";
import { GOOGLE_CALENDAR_DISCONNECTED_EVENT } from "@/hooks/calendar/calendar-storage";
import { clientServices } from "@/services";
import type {
  CalendarEvent,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

type MergeGoogleOpts = {
  incremental: boolean;
  syncRange?: { timeMin: string; timeMax: string };
};

export function useGoogleCalendarPlanningConnection(options: {
  calendarStoreReady: boolean;
  showGoogleCalendar: boolean;
  mergeGoogleCalendarSync: (
    imported: CalendarEvent[],
    opts: MergeGoogleOpts,
  ) => void;
  removeGoogleImportedEvents: () => void;
}) {
  const {
    calendarStoreReady,
    showGoogleCalendar,
    mergeGoogleCalendarSync,
    removeGoogleImportedEvents,
  } = options;

  const [googleCalendarLabel, setGoogleCalendarLabel] = useState<string | null>(
    null,
  );
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  const isSyncingRef = useRef(false);
  const didInitialGoogleSyncRef = useRef(false);

  const syncGoogleIfEnabled = useCallback(
    async (opts?: { show?: boolean }) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        const statusResult =
          await clientServices.googleCalendarIntegration.getStatus();
        if (!statusResult.ok) return;
        const status = statusResult.data;

        setGoogleCalendarLabel(status.email);
        setGoogleCalendarConnected(!!status.connected);

        if (!(opts?.show ?? showGoogleCalendar)) return;
        if (!status.connected) return;

        const syncResult =
          await clientServices.googleCalendarIntegration.sync();
        if (!syncResult.ok) return;
        const data = syncResult.data;
        mergeGoogleCalendarSync(data.imported, {
          incremental: data.incremental,
          syncRange: data.syncRange,
        });
      } finally {
        isSyncingRef.current = false;
      }
    },
    [mergeGoogleCalendarSync, showGoogleCalendar],
  );

  const pushGoogleThenSync = useCallback(
    async (event: CalendarEvent, scope?: GoogleCalendarRecurrenceScope) => {
      const ok = await pushConnectedGoogleCalendarEvent(event, scope);
      if (ok) await syncGoogleIfEnabled({ show: showGoogleCalendar });
    },
    [syncGoogleIfEnabled, showGoogleCalendar],
  );

  useEffect(() => {
    if (!calendarStoreReady) return;
    if (didInitialGoogleSyncRef.current) return;
    didInitialGoogleSyncRef.current = true;
    void syncGoogleIfEnabled({ show: showGoogleCalendar });
  }, [calendarStoreReady, showGoogleCalendar, syncGoogleIfEnabled]);

  useEffect(() => {
    const onDisconnected = () => {
      removeGoogleImportedEvents();
    };
    window.addEventListener(GOOGLE_CALENDAR_DISCONNECTED_EVENT, onDisconnected);
    return () =>
      window.removeEventListener(
        GOOGLE_CALENDAR_DISCONNECTED_EVENT,
        onDisconnected,
      );
  }, [removeGoogleImportedEvents]);

  return {
    googleCalendarLabel,
    googleCalendarConnected,
    syncGoogleIfEnabled,
    pushGoogleThenSync,
  };
}
