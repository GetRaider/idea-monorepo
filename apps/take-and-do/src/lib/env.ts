const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;

// Keep semantics explicit: preview behaves like dev for environment-flag purposes.
export const IS_PROD = vercelEnv === "production";
export const IS_PREVIEW = vercelEnv === "preview";
export const IS_DEV = vercelEnv === "development" || IS_PREVIEW;

