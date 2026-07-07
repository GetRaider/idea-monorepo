"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useCalendarRepositoryValue } from "./use-calendar-repository-value";
import type { CalendarRepository } from "./calendar-repository.types";

const CalendarRepositoryContext = createContext<CalendarRepository | null>(
  null,
);

export function CalendarRepositoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useCalendarRepositoryValue();
  return (
    <CalendarRepositoryContext.Provider value={value}>
      {children}
    </CalendarRepositoryContext.Provider>
  );
}

export function useCalendarRepository(): CalendarRepository {
  const context = useContext(CalendarRepositoryContext);
  if (!context) {
    throw new Error(
      "useCalendarRepository must be used within CalendarRepositoryProvider",
    );
  }
  return context;
}
