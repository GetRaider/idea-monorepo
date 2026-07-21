import type { Metadata } from "next";

import { WatchPageClient } from "./WatchPageClient";

export const metadata: Metadata = {
  title: "Watch | Lexly",
};

export default function WatchPage({
  params,
}: {
  params: { videoId: string };
}) {
  return <WatchPageClient videoId={params.videoId} />;
}

