import Link from "next/link";

import { primaryButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-32 text-center">
      <h1 className="text-4xl font-medium tracking-tight text-silver">Page not found</h1>
      <p className="mt-4 text-mist">The page you are looking for does not exist.</p>
      <Link href="/" className={`${primaryButton} mt-8`}>
        Back to home
      </Link>
    </div>
  );
}
