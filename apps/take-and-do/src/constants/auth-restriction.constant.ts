export const AUTH_RESTRICTION_MESSAGE =
  "User list is restricted for now. Continue as a Guest to explore the platform";

export const GOOGLE_SIGNUP_DISABLED_MESSAGE =
  "No account found for this Google sign-in. Only users who already have access can use Google here. Continue as a Guest to explore, or use an invited account.";

export const isAuthRestrictedInProductionBuild =
  process.env.NODE_ENV === "production";
