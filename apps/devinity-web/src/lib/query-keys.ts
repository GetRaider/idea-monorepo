export const queryKeys = {
  users: ["users"] as const,
  checkEmailSignup: (email: string) =>
    ["users", "check-email", "signup", email] as const,
  checkEmailSignin: (email: string) =>
    ["users", "check-email", "signin", email] as const,
} as const;
