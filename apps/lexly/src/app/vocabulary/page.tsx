import type { Metadata } from "next";

import { VocabularyPageClient } from "./VocabularyPageClient";

export const metadata: Metadata = {
  title: "My Vocabulary | Lexly",
};

export default function VocabularyPage() {
  return <VocabularyPageClient />;
}

