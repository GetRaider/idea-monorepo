/** FullCalendar custom `views` entries for multi-day time grids. */
export const PLANNING_CALENDAR_CUSTOM_VIEWS = {
  /** Seven days starting on the anchor date (use “today” so the current day is the left column). */
  timeGridRollingWeek: {
    type: "timeGrid" as const,
    duration: { days: 7 },
    dateIncrement: { days: 7 },
    dateAlignment: "day" as const,
    buttonText: "7d",
  },
  timeGridTwoDay: {
    type: "timeGrid" as const,
    duration: { days: 2 },
    buttonText: "2d",
  },
  timeGridThreeDay: {
    type: "timeGrid" as const,
    duration: { days: 3 },
    buttonText: "3d",
  },
  timeGridFourDay: {
    type: "timeGrid" as const,
    duration: { days: 4 },
    buttonText: "4d",
  },
  timeGridFiveDay: {
    type: "timeGrid" as const,
    duration: { days: 5 },
    buttonText: "5d",
  },
} as const;
