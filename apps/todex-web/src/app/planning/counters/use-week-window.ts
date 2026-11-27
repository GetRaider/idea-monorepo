"use client";

import { useState } from "react";
import { addDaysToDate } from "@repo/api/todex";

import { localToday } from "./counter-helpers";

/** Which seven days are on screen, stepping back a week at a time. */
export function useWeekWindow() {
  const [weeksBack, setWeeksBack] = useState(0);
  const today = localToday();
  const until = addDaysToDate(today, -7 * weeksBack);
  return { weeksBack, setWeeksBack, today, until };
}
