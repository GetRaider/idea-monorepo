import { Route } from "@/constants/route.constant";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#3c2856] p-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold pb-4">Sign up</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          User list is restricted for now. <br />
          <Link
            href={Route.LOGIN}
            className="text-[var(--accent-primary)] underline underline-offset-2"
          >
            Continue as a Guest
          </Link>{" "}
          to explore the platform.
        </p>
      </div>
    </div>
  );
}
