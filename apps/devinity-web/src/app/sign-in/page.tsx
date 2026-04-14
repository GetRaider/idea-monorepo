"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField } from "@radix-ui/themes";
import { cn } from "@repo/ui";

import { signIn, signUp, useSession } from "@lib/auth-client";
import { api } from "@lib/api";

interface PasswordValidation {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  messages: string[];
}

function passwordStrengthClass(strength: PasswordValidation["strength"]) {
  switch (strength) {
    case "strong":
      return "border border-green-400/20 bg-green-400/10 text-green-400";
    case "medium":
      return "border border-amber-400/20 bg-amber-400/10 text-amber-400";
    default:
      return "border border-red-400/20 bg-red-400/10 text-red-400";
  }
}

function validationMessageClass(type: "error" | "info") {
  return type === "error"
    ? "border border-red-400/20 bg-red-400/10 text-red-400"
    : "border border-slate-400/20 bg-slate-400/10 text-slate-400";
}

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      console.log("User is authenticated, redirecting to home");
      router.push("/");
    }
  }, [session, isPending, router]);

  const validatePassword = (password: string): PasswordValidation => {
    const messages: string[] = [];
    let strength: "weak" | "medium" | "strong" = "weak";

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasMinLength) messages.push("At least 8 characters");
    if (!hasUpperCase) messages.push("One uppercase letter");
    if (!hasLowerCase) messages.push("One lowercase letter");
    if (!hasNumber) messages.push("One number");
    if (!hasSpecialChar) messages.push("One special character");

    const criteriaCount = [
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (criteriaCount === 5) {
      strength = "strong";
    } else if (criteriaCount >= 3) {
      strength = "medium";
    }

    const isValid = criteriaCount === 5;

    return { isValid, strength, messages };
  };

  const checkEmailExists = async (email: string) => {
    if (!email || !isSignUp) {
      setEmailError(null);
      return;
    }

    try {
      const response = await api.get(
        `/user/check-email?email=${encodeURIComponent(email)}`,
      );
      if (response.data?.exists) {
        setEmailError("This email is already registered");
      } else {
        setEmailError(null);
      }
    } catch (err) {
      console.error("Email check error:", err);
      setEmailError(null);
    }
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (isSignUp && password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation(null);
    }
  };

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    setEmailError(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && isSignUp) {
        void checkEmailExists(formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, isSignUp]);

  const handleGitHubSignIn = async () => {
    try {
      setError(null);
      console.log("Starting GitHub sign-in...");

      await signIn.social({
        provider: "github",
        callbackURL: window.location.origin,
      });
    } catch (err) {
      console.error("Sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const handleEmailAuth = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isSignUp) {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        setError("Password does not meet security requirements");
        return;
      }

      if (emailError) {
        setError(emailError);
        return;
      }
    }

    if (!isSignUp) {
      try {
        const response = await api.get(
          `/users/check-email?email=${encodeURIComponent(formData.email)}`,
        );
        if (!response.data?.exists) {
          setError("No account found with this email. Please sign up first.");
          return;
        }
      } catch (err) {
        console.error("Email check error:", err);
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          callbackURL: window.location.origin,
        });
        console.log("Sign-up successful, redirecting...");
        router.push("/");
      } else {
        const result = await signIn.email({
          email: formData.email,
          password: formData.password,
          callbackURL: window.location.origin,
        });

        if (result.error) {
          throw new Error(result.error.message || "Invalid email or password");
        }

        console.log("Sign-in successful, redirecting...");
        router.push("/");
      }
    } catch (err: unknown) {
      console.error("Authentication error:", err);

      let errorMessage = "Authentication failed";

      if (err instanceof Error && err.message) {
        const messageLower = err.message.toLowerCase();
        if (
          messageLower.includes("password") ||
          messageLower.includes("invalid credentials")
        ) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (
          messageLower.includes("email") &&
          messageLower.includes("not found")
        ) {
          errorMessage = "No account found with this email.";
        } else if (
          messageLower.includes("already exists") ||
          messageLower.includes("duplicate")
        ) {
          errorMessage = "An account with this email already exists.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setEmailError(null);
    setPasswordValidation(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="flex w-full max-w-[450px] flex-col items-center gap-8 rounded-[20px] border border-white/10 bg-white/5 p-12 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <h1 className="m-0 bg-gradient-to-br from-violet-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent">
            Devinity
          </h1>
        </div>
        <h2 className="m-0 text-center text-3xl font-semibold text-slate-50">
          Welcome to Devinity
        </h2>
        <p className="m-0 max-w-[350px] text-center text-lg leading-relaxed text-slate-300">
          Your personal development companion. Sign in to get started and access
          all features.
        </p>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-3 text-center text-sm text-red-400">
            {error}
            {!isSignUp && error.includes("No account found") && (
              <>
                {" "}
                <Button
                  variant="ghost"
                  size="2"
                  onClick={toggleMode}
                  className="inline p-0 font-medium text-inherit underline"
                >
                  Create an account
                </Button>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="flex w-full flex-col gap-4">
          {isSignUp && (
            <TextField.Root
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(event) =>
                setFormData({ ...formData, name: event.target.value })
              }
              required
              size="3"
            />
          )}
          <div className="w-full">
            <TextField.Root
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(event) => handleEmailChange(event.target.value)}
              required
              color={emailError ? "red" : undefined}
              size="3"
            />
            {emailError && (
              <div
                className={cn(
                  "mt-2 rounded-md p-2 text-sm",
                  validationMessageClass("error"),
                )}
              >
                {emailError}
              </div>
            )}
          </div>
          <div className="w-full">
            <TextField.Root
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(event) => handlePasswordChange(event.target.value)}
              required
              minLength={isSignUp ? 8 : 6}
              size="3"
            />
            {isSignUp && passwordValidation && formData.password && (
              <>
                <div
                  className={cn(
                    "mt-2 rounded-md p-2 text-sm font-medium capitalize",
                    passwordStrengthClass(passwordValidation.strength),
                  )}
                >
                  Password strength: {passwordValidation.strength}
                </div>
                {passwordValidation.messages.length > 0 && (
                  <div
                    className={cn(
                      "mt-2 rounded-md p-2 text-sm",
                      validationMessageClass("info"),
                    )}
                  >
                    Required: {passwordValidation.messages.join(", ")}
                  </div>
                )}
              </>
            )}
          </div>
          <Button
            type="submit"
            disabled={
              isLoading ||
              (isSignUp && !!emailError) ||
              (isSignUp && !!passwordValidation && !passwordValidation.isValid)
            }
            size="3"
            variant="solid"
            color="violet"
            className="w-full"
          >
            {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <p className="m-0 text-center text-slate-300">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <Button
            variant="ghost"
            size="2"
            onClick={toggleMode}
            className="ml-1 inline p-0 text-violet-500 underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Button>
        </p>

        <div className="flex w-full items-center gap-4 text-sm text-slate-400">
          <div className="h-px flex-1 bg-white/10" />
          <span>OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button
          onClick={() => void handleGitHubSignIn()}
          size="3"
          variant="solid"
          color="gray"
          className="flex min-w-[250px] w-full items-center justify-center gap-3 bg-[#24292e]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
}
