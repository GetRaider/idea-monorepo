import { z } from "zod";

export const UserPreferencesSchema = z.object({
  calendarEnabled: z.boolean(),
});

export const UpdateUserPreferencesBodySchema = UserPreferencesSchema;

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UpdateUserPreferencesBody = z.infer<
  typeof UpdateUserPreferencesBodySchema
>;
