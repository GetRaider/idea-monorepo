import { Route } from "@/constants/route.constant";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {/* TODO: email/password sign-up flow */}
          Registration is not available yet. Use{" "}
          <Link
            href={Route.LOGIN}
            className="text-[var(--accent-primary)] underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          or use &quot;Continue without account&quot; on the login page for a
          temporary anonymous session.
        </p>
      </div>
    </div>
  );
}
