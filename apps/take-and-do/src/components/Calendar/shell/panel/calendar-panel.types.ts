import type {
  CalendarBacklogEvent,
  CalendarKindVisibility,
} from "@/types/calendar.types";

export type CalendarPanelProps = {
  items: CalendarBacklogEvent[];
  onRequestNewTemplate: () => void;
  onEditTemplate: (item: CalendarBacklogEvent) => void;
  onRemoveItem: (id: string) => void;
  kindVisibility: CalendarKindVisibility;
  onKindVisibilityChange: (next: CalendarKindVisibility) => void;
  onPickCalendarDay: (date: Date) => void;
  showInternalCalendar: boolean;
  onShowInternalCalendarChange: (next: boolean) => void;
  showGoogleCalendar: boolean;
  onShowGoogleCalendarChange: (next: boolean) => void;
  googleCalendarLabel?: string | null;
  internalCalendarColor: string | undefined;
  googleCalendarColor: string | undefined;
  onInternalCalendarColorChange: (color: string | null) => void;
  onGoogleCalendarColorChange: (color: string | null) => void;
};
