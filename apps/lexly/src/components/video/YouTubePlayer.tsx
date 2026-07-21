"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        options: Record<string, unknown>,
      ) => {
        getCurrentTime: () => number;
        setPlaybackRate: (rate: number) => void;
        getPlaybackRate: () => number;
        playVideo: () => void;
        pauseVideo: () => void;
        destroy: () => void;
      };
      PlayerState: {
        PAUSED: number;
        PLAYING: number;
      };
    };
  }
}

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://www.youtube.com/iframe_api"]',
  );
  if (existing) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.YT?.Player) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  return new Promise((resolve) => {
    (window as unknown as { onYouTubeIframeAPIReady?: () => void })
      .onYouTubeIframeAPIReady = resolve;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

export function YouTubePlayer({
  videoId,
  playbackRateDefault = 1,
  onTimeUpdateMs,
}: {
  videoId: string;
  playbackRateDefault?: number;
  onTimeUpdateMs: (timeMs: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<InstanceType<NonNullable<Window["YT"]>["Player"]> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(playbackRateDefault);

  const normalizedVideoId = useMemo(() => videoId.trim(), [videoId]);

  useEffect(() => {
    setPlaybackRate(playbackRateDefault);
  }, [playbackRateDefault]);

  useEffect(() => {
    let intervalId: number | null = null;
    let destroyed = false;

    async function init() {
      await loadYouTubeIframeApi();
      if (destroyed) return;
      const container = containerRef.current;
      if (!container) return;
      if (!window.YT?.Player) return;

      const player = new window.YT.Player(container, {
        videoId: normalizedVideoId,
        playerVars: {
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            player.setPlaybackRate(playbackRateDefault);
            setPlaybackRate(playbackRateDefault);

            intervalId = window.setInterval(() => {
              const timeSec = player.getCurrentTime();
              onTimeUpdateMs(Math.max(0, timeSec * 1000));
            }, 250);
          },
          onStateChange: (event: { data: number }) => {
            if (!window.YT?.PlayerState) return;
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });

      playerRef.current = player;
    }

    init();

    return () => {
      destroyed = true;
      if (intervalId) window.clearInterval(intervalId);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [normalizedVideoId, onTimeUpdateMs, playbackRateDefault]);

  const handleTogglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  };

  const rates = [0.75, 1, 1.25, 1.5] as const;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTogglePlay}
          disabled={!isReady}
          className="bg-white/60"
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted)]">
            Speed
          </span>
          <div className="flex flex-wrap gap-1">
            {rates.map((rate) => (
              <Button
                key={rate}
                type="button"
                variant={rate === playbackRate ? "default" : "outline"}
                size="xs"
                className="rounded-full"
                onClick={() => {
                  setPlaybackRate(rate);
                  playerRef.current?.setPlaybackRate(rate);
                }}
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

