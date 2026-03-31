import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth/server";
import { LandingPage } from "./landing-page";

export default async function StartPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.session) redirect("/overview");
  return <LandingPage />;
}
