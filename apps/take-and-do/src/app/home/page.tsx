import { redirect } from "next/navigation";

export default function LegacyHomeRedirectPage() {
  redirect("/overview");
}
