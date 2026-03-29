import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { LandingPage } from "./landing-page";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.session) redirect("/overview");
  return <LandingPage />;
}
