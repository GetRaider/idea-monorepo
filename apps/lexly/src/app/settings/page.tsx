import type { Metadata } from "next";

import { SettingsPageClient } from "./SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings | Lexly",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}

