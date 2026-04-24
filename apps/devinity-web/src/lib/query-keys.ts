export const queryKeys = {
  users: ["users"] as const,
  checkEmailSignup: (email: string) =>
    ["users", "email-exists", "signup", email] as const,
  checkEmailSignin: (email: string) =>
    ["users", "email-exists", "signin", email] as const,
} as const;
