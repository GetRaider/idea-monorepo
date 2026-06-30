"use client";

import { DotsVerticalIcon } from "@/components/Icons";
import { cn } from "@/lib/styles/utils";
import {
  effectiveGoogleCalendarColor,
  effectiveInternalCalendarColor,
} from "@/helpers/calendar/calendar-colors";

import { CalendarColorPickerPopover } from "../../shared/ColorPickerPopover";
import { CAL_PANEL_BODY_GUTTER } from "./calendar-panel.constants";

type CalendarPanelCalendarsBodyProps = {
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

export function CalendarPanelCalendarsBody({
  showInternalCalendar,
  onShowInternalCalendarChange,
  showGoogleCalendar,
  onShowGoogleCalendarChange,
  googleCalendarLabel,
  internalCalendarColor,
  googleCalendarColor,
  onInternalCalendarColorChange,
  onGoogleCalendarColorChange,
}: CalendarPanelCalendarsBodyProps) {
  return (
    <ul className={cn("space-y-2", CAL_PANEL_BODY_GUTTER)}>
      <li className="group/calPanelInternal flex items-center gap-2 rounded-lg py-0.5 pr-0.5 transition-colors hover:bg-white/[0.04]">
        <input
          id="cal-internal"
          type="checkbox"
          checked={showInternalCalendar}
          onChange={(event) =>
            onShowInternalCalendarChange(event.target.checked)
          }
          className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
        />
        <label
          htmlFor="cal-internal"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-sm"
            style={{
              backgroundColor: effectiveInternalCalendarColor(
                internalCalendarColor,
              ),
            }}
            aria-hidden
          />
          <span className="truncate">Internal</span>
        </label>
        <div
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-zinc-500 opacity-0 transition-opacity duration-150",
            "group-hover/calPanelInternal:opacity-100",
          )}
        >
          <CalendarColorPickerPopover
            selectedHex={effectiveInternalCalendarColor(internalCalendarColor)}
            onSelect={(hex) => onInternalCalendarColorChange(hex)}
            onResetToDefault={() => onInternalCalendarColorChange(null)}
            trigger={<DotsVerticalIcon size={14} />}
          />
        </div>
      </li>
      <li className="group/calPanelGcal flex items-center gap-2 rounded-lg py-0.5 pr-0.5 transition-colors hover:bg-white/[0.04]">
        <input
          id="cal-google"
          type="checkbox"
          checked={showGoogleCalendar}
          onChange={(event) => onShowGoogleCalendarChange(event.target.checked)}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
        />
        <label
          htmlFor="cal-google"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-sm"
            style={{
              backgroundColor:
                effectiveGoogleCalendarColor(googleCalendarColor),
            }}
            aria-hidden
          />
          <span className="truncate">
            {googleCalendarLabel ?? "Google Calendar"}
          </span>
        </label>
        <div
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-zinc-500 opacity-0 transition-opacity duration-150",
            "group-hover/calPanelGcal:opacity-100",
          )}
        >
          <CalendarColorPickerPopover
            selectedHex={effectiveGoogleCalendarColor(googleCalendarColor)}
            onSelect={(hex) => onGoogleCalendarColorChange(hex)}
            onResetToDefault={() => onGoogleCalendarColorChange(null)}
            trigger={<DotsVerticalIcon size={14} />}
          />
        </div>
      </li>
    </ul>
  );
}
