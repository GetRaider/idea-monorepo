import type { NormalizedToolResult } from "../runs/agent-runs.repository";

export function decideWebSearchReservation(
  input: WebSearchReservationInput,
): WebSearchReservation {
  if (input.existing) {
    if (input.existing.status === "reserved") return { action: "run" };
    return { action: "return", result: input.existing.result };
  }
  const allowed =
    input.webResearch &&
    input.webSearchCapability === "tool" &&
    input.handlerRegistered;
  if (!allowed) {
    return {
      action: "insert",
      status: "rejected",
      result: { ok: false, error: "web_search_unauthorized" },
    };
  }
  if (input.attemptCount >= input.maxAttempts) {
    return {
      action: "insert",
      status: "rejected",
      result: { ok: false, error: "limit" },
    };
  }
  return {
    action: "insert",
    status: "reserved",
    result: { ok: false, error: "reserved" },
  };
}

export interface WebSearchReservationInput {
  existing: { status: string; result: NormalizedToolResult } | null;
  attemptCount: number;
  webResearch: boolean;
  webSearchCapability: string;
  handlerRegistered: boolean;
  maxAttempts: number;
}

export type WebSearchReservation =
  | { action: "run" }
  | { action: "return"; result: NormalizedToolResult }
  | { action: "insert"; status: "rejected" | "reserved"; result: NormalizedToolResult };
