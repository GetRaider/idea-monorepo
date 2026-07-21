"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";

export default function HomePage() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exampleLinks: Array<{ id: string; label: string }> = [
    { id: "qz0aGYrrlhU", label: "English conversation practice" },
    { id: "jNQXAC9IVRw", label: "Quick pronunciation drill" },
    { id: "hTWKbfoikeg", label: "Learn with captions (demo)" },
  ];

  const handleWatch = async () => {
    setIsSubmitting(true);
    try {
      const videoId = parseYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        toast.error("Paste a valid YouTube link (or a 11-char video id).");
        return;
      }

      router.push(`/watch/${videoId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold text-[var(--foreground)]">
          Learn vocabulary from real YouTube content.
        </h1>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-[var(--muted)]">
          Paste a link, click words inside subtitles, save what matters, and
          review with lightweight spaced repetition.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full flex-1 rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            onKeyDown={(event) => {
              if (event.key === "Enter") handleWatch();
            }}
          />
          <button
            onClick={handleWatch}
            disabled={isSubmitting}
            className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Loading..." : "Watch"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {exampleLinks.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() =>
                setYoutubeUrl(`https://www.youtube.com/watch?v=${example.id}`)
              }
              className="rounded-full border border-[var(--border)] bg-white/40 px-3 py-1 text-xs font-medium text-[var(--foreground)]/80 hover:bg-white/70"
            >
              {example.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

