import { z } from "zod";

export const UserPreferencesSchema = z.object({
  calendarEnabled: z.boolean(),
  countersEnabled: z.boolean(),
});

/** Only the settings sent are changed. */
export const UpdateUserPreferencesBodySchema =
  UserPreferencesSchema.partial().refine(
    (body) => Object.values(body).some((value) => value !== undefined),
    { message: "Send at least one preference" },
  );

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UpdateUserPreferencesBody = z.infer<
  typeof UpdateUserPreferencesBodySchema
>;
