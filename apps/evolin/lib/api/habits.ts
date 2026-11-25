import type {
  CheckInStatus,
  CreateHabitInput,
  HabitDetailResponse,
  HabitListResponse,
  HabitMutationResponse,
  SkipReason,
  UpdateHabitInput,
  WeekResponse,
} from "@repo/evolin-shared";

import { apiRequest } from "./client";

export function getRequestContext() {
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
  return { timeZone, date: formatLocalDate(new Date()) };
}

export function listHabits(): Promise<HabitListResponse> {
  return apiRequest(`/v1/habits?${new URLSearchParams(getRequestContext())}`);
}

export function getHabit(habitId: string): Promise<HabitDetailResponse> {
  return apiRequest(
    `/v1/habits/${encodeURIComponent(habitId)}?${new URLSearchParams(getRequestContext())}`,
  );
}

export function getWeek(anchorDate?: string): Promise<WeekResponse> {
  const context = getRequestContext();
  return apiRequest(
    `/v1/habits/week?${new URLSearchParams({
      timeZone: context.timeZone,
      date: anchorDate ?? context.date,
    })}`,
  );
}

export function createHabit(
  input: CreateHabitInput,
): Promise<HabitMutationResponse> {
  return apiRequest("/v1/habits", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateHabit(
  habitId: string,
  input: Omit<UpdateHabitInput, "timeZone" | "date">,
): Promise<HabitMutationResponse> {
  return apiRequest(`/v1/habits/${encodeURIComponent(habitId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...input, ...getRequestContext() }),
  });
}

export function deleteHabit(habitId: string): Promise<void> {
  return apiRequest(`/v1/habits/${encodeURIComponent(habitId)}`, {
    method: "DELETE",
  });
}

export function startEstablishing(
  habitId: string,
): Promise<HabitMutationResponse> {
  return apiRequest(`/v1/habits/${encodeURIComponent(habitId)}/start`, {
    method: "POST",
    body: JSON.stringify(getRequestContext()),
  });
}

export function putCheckIn(
  habitId: string,
  date: string,
  checkpointIndex: number,
  input: {
    status: CheckInStatus;
    skipReason: SkipReason | null;
    note: string | null;
  },
): Promise<HabitMutationResponse> {
  return apiRequest(
    `/v1/habits/${encodeURIComponent(habitId)}/check-ins/${date}/${checkpointIndex}`,
    {
      method: "PUT",
      body: JSON.stringify({
        ...input,
        timeZone: getRequestContext().timeZone,
      }),
    },
  );
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
