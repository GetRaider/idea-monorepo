import type { FocusActionResult } from "@/types/focus.types";

export const focusSuccess: FocusActionResult = { status: "SUCCESS" };

export function focusRejected(reason: string): FocusActionResult {
  return { status: "REJECTED", reason };
}

export function focusConstraint(reason: string): FocusActionResult {
  return { status: "CONSTRAINT_VIOLATION", reason };
}
