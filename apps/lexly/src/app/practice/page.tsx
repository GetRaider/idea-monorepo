import type { Metadata } from "next";

import { PracticePageClient } from "./PracticePageClient";

export const metadata: Metadata = {
  title: "Practice | Lexly",
};

export default function PracticePage() {
  return <PracticePageClient />;
}

