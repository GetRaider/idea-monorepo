"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { CalendarEventPatchBody } from "@/db/dtos/calendar-events.dto";
import { userCalendarEventToCreateBody } from "@/helpers/calendar-grid-server.helper";
import { useCalendarStore } from "@/hooks/calendar/use-calendar-store";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { clientServices } from "@/services";
import type { CalendarEvent } from "@/types/calendar.types";

import type { CalendarRepository } from "./calendar-repository.types";

export function useCalendarRepositoryValue(): CalendarRepository {
  const { useLocalWorkspace: isLocalCalendar } = useWorkspaceRepository();
  const calendarStore = useCalendarStore();
  const queryClient = useQueryClient();

  const bumpServerCalendar = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  const createCalendarEvent = useCallback(
    async (event: CalendarEvent): Promise<CalendarEvent | null> => {
      if (event.type !== "common" && event.type !== "timeBlock") return null;
      return clientServices.calendarEvents.create(
        userCalendarEventToCreateBody(event),
      );
    },
    [],
  );

  const updateCalendarEvent = useCallback(
    async (
      id: string,
      patch: CalendarEventPatchBody,
    ): Promise<CalendarEvent | null> => {
      return clientServices.calendarEvents.update(id, patch);
    },
    [],
  );

  const deleteCalendarEvent = useCallback(
    async (id: string): Promise<boolean> => {
      return clientServices.calendarEvents.remove(id);
    },
    [],
  );

  return {
    ...calendarStore,
    isLocalCalendar,
    bumpServerCalendar,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  };
}
