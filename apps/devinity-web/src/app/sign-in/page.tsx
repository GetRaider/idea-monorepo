"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { signIn, signUp, useSession } from "@lib/auth-client";
import { api } from "@lib/api";
import {
  SignInContainer,
  SignInCard,
  SignInTitle,
  SignInDescription,
  GitHubButton,
  Logo,
  BrandName,
  Divider,
  Form,
  Input,
  SubmitButton,
  ToggleText,
  ErrorMessage,
  PasswordStrength,
  ValidationMessage,
} from "./page.styles";

interface PasswordValidation {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  messages: string[];
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

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isPending && session?.user) {
      console.log("User is authenticated, redirecting to home");
      router.push("/");
    }
  }, [session, isPending, router]);

  // Validate password strength
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

  // Check if email exists
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
      // Don't show error if the endpoint doesn't exist yet
      setEmailError(null);
    }
  };

  // Handle password change with validation
  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (isSignUp && password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation(null);
    }
  };

  // Handle email change with debounced existence check
  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    setEmailError(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && isSignUp) {
        checkEmailExists(formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, isSignUp]);

  const handleGitHubSignIn = async () => {
    try {
      setError(null);
      console.log("Starting GitHub sign-in...");

      // Call the backend to get the OAuth URL, then redirect
      await signIn.social({
        provider: "github",
        callbackURL: window.location.origin,
      });
    } catch (err) {
      console.error("Sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password strength on sign-up
    if (isSignUp) {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        setError("Password does not meet security requirements");
        return;
      }

      // Check for email error
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    // For sign-in, check if email exists
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
        // Continue with sign-in even if check fails
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        await signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          callbackURL: window.location.origin,
        });
        console.log("Sign-up successful, redirecting...");
        router.push("/");
      } else {
        // Sign in
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
    } catch (err: any) {
      console.error("Authentication error:", err);

      // Provide user-friendly error messages
      let errorMessage = "Authentication failed";

      if (err.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes("password") || msg.includes("invalid credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (msg.includes("email") && msg.includes("not found")) {
          errorMessage = "No account found with this email.";
        } else if (
          msg.includes("already exists") ||
          msg.includes("duplicate")
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
    <SignInContainer>
      <SignInCard>
        <Logo>
          <BrandName>Devinity</BrandName>
        </Logo>
        <SignInTitle>Welcome to Devinity</SignInTitle>
        <SignInDescription>
          Your personal development companion. Sign in to get started and access
          all features.
        </SignInDescription>

        {error && (
          <ErrorMessage>
            {error}
            {!isSignUp && error.includes("No account found") && (
              <>
                {" "}
                <button
                  onClick={toggleMode}
                  style={{
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Create an account
                </button>
              </>
            )}
          </ErrorMessage>
        )}

        <Form onSubmit={handleEmailAuth}>
          {isSignUp && (
            <Input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          )}
          <div style={{ width: "100%" }}>
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              $hasError={!!emailError}
            />
            {emailError && (
              <ValidationMessage $type="error">{emailError}</ValidationMessage>
            )}
          </div>
          <div style={{ width: "100%" }}>
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={isSignUp ? 8 : 6}
            />
            {isSignUp && passwordValidation && formData.password && (
              <>
                <PasswordStrength $strength={passwordValidation.strength}>
                  Password strength: {passwordValidation.strength}
                </PasswordStrength>
                {passwordValidation.messages.length > 0 && (
                  <ValidationMessage $type="info">
                    Required: {passwordValidation.messages.join(", ")}
                  </ValidationMessage>
                )}
              </>
            )}
          </div>
          <SubmitButton
            type="submit"
            disabled={
              isLoading ||
              (isSignUp && !!emailError) ||
              (isSignUp && !!passwordValidation && !passwordValidation.isValid)
            }
          >
            {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </SubmitButton>
        </Form>

        <ToggleText>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button onClick={toggleMode}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </ToggleText>

        <Divider>OR</Divider>

        <GitHubButton onClick={handleGitHubSignIn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </GitHubButton>
      </SignInCard>
    </SignInContainer>
  );
}
