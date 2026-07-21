import type { Metadata } from "next";

import { ProgressPageClient } from "./ProgressPageClient";

export const metadata: Metadata = {
  title: "Progress | Lexly",
};

export default function ProgressPage() {
  return <ProgressPageClient />;
}

