import type {
  CreateHabitInput,
  HabitDetailResponse,
  HabitListResponse,
  HabitMutationResponse,
  Practice,
  PracticeOutcome,
  UpdateHabitInput,
} from '@repo/evolin-shared';

import { apiRequest } from './client';

export function getRequestContext() {
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
  const date = formatLocalDate(new Date());
  return { timeZone, date };
}

export function listHabits(): Promise<HabitListResponse> {
  const context = getRequestContext();
  return apiRequest(`/v1/habits?${new URLSearchParams(context)}`);
}

export function getHabit(habitId: string): Promise<HabitDetailResponse> {
  const context = getRequestContext();
  return apiRequest(
    `/v1/habits/${encodeURIComponent(habitId)}?${new URLSearchParams(context)}`,
  );
}

export function createHabit(
  input: Omit<CreateHabitInput, 'timeZone' | 'date'>,
): Promise<HabitMutationResponse> {
  return apiRequest('/v1/habits', {
    method: 'POST',
    body: JSON.stringify({ ...input, ...getRequestContext() }),
  });
}

export function updateHabit(
  habitId: string,
  input: Omit<UpdateHabitInput, 'timeZone' | 'date'>,
): Promise<HabitMutationResponse> {
  return apiRequest(`/v1/habits/${encodeURIComponent(habitId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...input, ...getRequestContext() }),
  });
}

export function deleteHabit(habitId: string): Promise<void> {
  return apiRequest(`/v1/habits/${encodeURIComponent(habitId)}`, {
    method: 'DELETE',
  });
}

export function transitionHabit(
  habitId: string,
  action: HabitAction,
): Promise<HabitMutationResponse> {
  return apiRequest(
    `/v1/habits/${encodeURIComponent(habitId)}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify(getRequestContext()),
    },
  );
}

export function putPractice(
  habitId: string,
  date: string,
  outcome: PracticeOutcome,
): Promise<Practice> {
  return apiRequest(
    `/v1/habits/${encodeURIComponent(habitId)}/practices/${date}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        outcome,
        timeZone: getRequestContext().timeZone,
      }),
    },
  );
}

export function deletePractice(
  habitId: string,
  date: string,
): Promise<void> {
  const { timeZone } = getRequestContext();
  return apiRequest(
    `/v1/habits/${encodeURIComponent(habitId)}/practices/${date}?${new URLSearchParams({ timeZone })}`,
    { method: 'DELETE' },
  );
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type HabitAction =
  | 'activate'
  | 'pause'
  | 'resume'
  | 'backlog'
  | 'graduate';
