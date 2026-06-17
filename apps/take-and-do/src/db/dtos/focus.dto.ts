import { z } from "zod";

const focusSessionStatusSchema = z.enum(["completed", "interrupted"]);

export const FocusSessionRecordDto = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("focus"),
    name: z.string(),
    taskId: z.string().nullable(),
    color: z.string().optional(),
    plannedDurationSeconds: z.number(),
    actualDurationSeconds: z.number(),
    startedAt: z.string(),
    endedAt: z.string(),
    status: focusSessionStatusSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("break"),
    parentFocusSessionId: z.string(),
    plannedDurationSeconds: z.number(),
    actualDurationSeconds: z.number(),
    startedAt: z.string(),
    endedAt: z.string(),
    status: focusSessionStatusSchema,
  }),
]);

export const FocusBacklogItemDto = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number().int().min(1),
  color: z.string(),
  createdAt: z.string(),
});

export const CreateFocusStateDto = z.object({
  sessions: z.array(FocusSessionRecordDto).optional(),
  backlog: z.array(FocusBacklogItemDto).optional(),
});

export const UpdateFocusStateDto = z
  .object({
    appendSession: FocusSessionRecordDto.optional(),
    appendBacklogItem: FocusBacklogItemDto.optional(),
    sessions: z.array(FocusSessionRecordDto).optional(),
    backlog: z.array(FocusBacklogItemDto).optional(),
  })
  .refine(
    (value) =>
      value.appendSession !== undefined ||
      value.appendBacklogItem !== undefined ||
      value.sessions !== undefined ||
      value.backlog !== undefined,
    { message: "At least one update field is required" },
  );

export type CreateFocusStateInput = z.infer<typeof CreateFocusStateDto>;
export type UpdateFocusStateInput = z.infer<typeof UpdateFocusStateDto>;
