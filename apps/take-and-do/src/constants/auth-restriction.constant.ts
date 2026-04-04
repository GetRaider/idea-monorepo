export const AUTH_RESTRICTION_MESSAGE =
  "User list is restricted for now. Continue as a Guest to explore the platform";

export const isAuthRestrictedInProductionBuild =
  process.env.NODE_ENV === "production";
