import { z } from "zod";

const envSchema = z.object({
  DB_CONNECTION_STRING: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

const parsedEnv = envSchema.parse(process.env);

const dbConnectionString =
  parsedEnv.DB_CONNECTION_STRING ??
  (parsedEnv.NODE_ENV === "test"
    ? "postgresql://user:password@localhost:5432/lexly"
    : undefined);

if (!dbConnectionString) {
  throw new Error("Missing DB_CONNECTION_STRING.");
}

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  db: {
    connectionString: dbConnectionString,
  },
};

