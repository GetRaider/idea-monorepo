import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client";
import { users, sessions, accounts, verifications } from "./db/auth-schema";
import { env } from "./env/env";

const isDevelopment = process.env.NODE_ENV !== "production";

// Password validation function
function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
} {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      error: "Password must be at least 8 characters long",
    };
  }
  if (!hasUpperCase) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }
  if (!hasLowerCase) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }
  if (!hasNumber) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  if (!hasSpecialChar) {
    return {
      valid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { valid: true };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),
  baseURL: env.api.baseUrl,
  secret: env.auth.secret,
  trustedOrigins: [env.web.baseUrl],
  basePath: "/api/auth",
  advanced: {
    useSecureCookies: !isDevelopment,
    cookiePrefix: "better-auth",
    cookies: {
      session_token: {
        attributes: {
          sameSite: isDevelopment ? "lax" : "none",
          secure: !isDevelopment,
          httpOnly: true,
        },
      },
      session_data: {
        attributes: {
          sameSite: isDevelopment ? "lax" : "none",
          secure: !isDevelopment,
          httpOnly: true,
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    async onSignUpEmail(user, request) {
      // Validate password strength before sign-up
      const body: any = request.body;
      if (body?.password) {
        const validation = validatePasswordStrength(body.password);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
    },
  },
  socialProviders: {
    github: {
      clientId: env.github.clientId,
      clientSecret: env.github.clientSecret,
    },
  },
});
