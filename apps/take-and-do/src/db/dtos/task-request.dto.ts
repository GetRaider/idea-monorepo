import { z } from "zod";

import { tasksHelper } from "@/helpers/task.helper";
import type { TaskPostPayload } from "@/helpers/task.helper";

export const TaskPostBodySchema: z.ZodType<TaskPostPayload> = z
  .any()
  .superRefine((val, ctx) => {
    try {
      tasksHelper.fromJson.postPayload(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid task create body",
      });
    }
  })
  .transform((raw) => tasksHelper.fromJson.postPayload(raw));

export const TaskPatchBodySchema = z
  .any()
  .transform((raw) => tasksHelper.fromJson.patch(raw));
