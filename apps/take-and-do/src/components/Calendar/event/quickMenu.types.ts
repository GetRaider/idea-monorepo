import type { RefObject } from "react";

import type { CalendarEventColorTheme } from "@/helpers/calendar/calendar-event-mapper";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarRsvpStatus,
} from "@/types/calendar.types";

export type CalendarQuickMenuPayload =
  | {
      mode: "existing";
      event: CalendarEvent;
      anchor: { clientX: number; clientY: number };
      anchorRect?: DOMRect;
    }
  | {
      mode: "draft";
      start: Date;
      end: Date;
      fcSelectionEnd: Date;
      allDay: boolean;
      anchor: { clientX: number; clientY: number };
      anchorRect?: DOMRect;
    };

export type CalendarOpenFullEditorContext = {
  mode: "existing" | "draft";
  event?: CalendarEvent;
  range?: { start: Date; end: Date; allDay: boolean };
  quickFields: {
    title: string;
    type: CalendarEventType;
    description: string;
    color?: string;
    saveToGoogle?: boolean;
    taskScope?: string[];
  };
};

export type CommonCreateDestination = "internal" | "google";

export interface QuickMenuProps {
  payload: CalendarQuickMenuPayload;
  scopeRef: RefObject<HTMLElement | null>;
  googleCalendarConnected?: boolean;
  onCreateDraft?: (
    event: CalendarEvent,
    opts?: { saveToGoogle?: boolean },
  ) => void;
  onClose: () => void;
  onOpenFullEditor: (context: CalendarOpenFullEditorContext) => void;
  onPersistExisting?: (
    id: string,
    patch: Partial<
      Omit<CalendarEvent, "id" | "type" | "taskBoardId" | "taskId" | "color">
    > & { color?: string | null },
  ) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onRsvpChange?: (
    id: string,
    rsvp: CalendarRsvpStatus,
    declineReason?: string,
  ) => void;
  onDraftSelectionBump?: () => void;
  onDraftKindChange?: (kind: CalendarEventType) => void;
  displayTimes24h?: boolean;
  onDisplayTimes24hChange?: (next: boolean) => void;
  calendarColorTheme?: CalendarEventColorTheme;
}
