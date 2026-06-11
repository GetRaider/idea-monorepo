"use client";

import { createContext, useContext } from "react";

import { useFocusSession } from "@/hooks/focus/useFocusSession";

import type { FocusSessionContextValue } from "@/hooks/focus/useFocusSession";

const FocusSessionContext = createContext<FocusSessionContextValue | null>(
  null,
);

export function FocusSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useFocusSession();

  return (
    <FocusSessionContext.Provider value={value}>
      {children}
    </FocusSessionContext.Provider>
  );
}

export function useFocusSessionContext(): FocusSessionContextValue {
  const context = useContext(FocusSessionContext);
  if (!context) {
    throw new Error(
      "useFocusSessionContext must be used within FocusSessionProvider",
    );
  }
  return context;
}
