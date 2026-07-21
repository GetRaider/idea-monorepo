import { describe, expect, it, vi, beforeAll } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
  useQueryClient: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children?: React.ReactNode;
  }) =>
    React.createElement("a", { href, className }, children),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) =>
    React.createElement("div", {
      "data-skeleton": true,
      className,
    }),
}));

vi.mock("@/components/video/YouTubePlayer", () => ({
  YouTubePlayer: () => React.createElement("div", { "data-youtube-player": true }),
}));

vi.mock("@/components/video/SubtitlePanel", () => ({
  SubtitlePanel: () => React.createElement("div", { "data-subtitle-panel": true }),
}));

vi.mock("@/components/video/DefinitionSheet", () => ({
  DefinitionSheet: () => React.createElement("div", { "data-definition-sheet": true }),
}));

let WatchPageClient: typeof import("./WatchPageClient").WatchPageClient;

beforeAll(async () => {
  const mod = await import("./WatchPageClient");
  WatchPageClient = mod.WatchPageClient;
});

function render(videoId: string) {
  if (!WatchPageClient) throw new Error("WatchPageClient not initialized");
  return renderToStaticMarkup(React.createElement(WatchPageClient, { videoId }));
}

describe("WatchPageClient", () => {
  it("renders transcript skeleton + desktop grid layout at lg breakpoint", () => {
    useQueryMock.mockImplementation((arg: unknown) => {
      const queryKey = (arg as { queryKey?: unknown })?.queryKey;
      const key0 = Array.isArray(queryKey) ? queryKey[0] : queryKey;

      if (key0 === "settings") {
        return {
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
        };
      }

      // transcript
      return {
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      };
    });

    const html = render("qz0aGYrrlhU");

    expect(html).toContain("lg:grid-cols-[1fr_0.95fr]");
    expect(html).toContain("aspect-video");

    expect(html).not.toContain('data-youtube-player="true"');
    expect(html).not.toContain('data-subtitle-panel="true"');
  });
});

