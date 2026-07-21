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

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) =>
    React.createElement("div", {
      "data-skeleton": true,
      className,
    }),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    className,
    children,
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => React.createElement("div", { className }, children),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("span", null, children),
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) =>
    React.createElement("div", { "data-progress": value }),
}));

let ProgressPageClient: typeof import("./ProgressPageClient").ProgressPageClient;

beforeAll(async () => {
  const mod = await import("./ProgressPageClient");
  ProgressPageClient = mod.ProgressPageClient;
});

function render() {
  if (!ProgressPageClient) throw new Error("ProgressPageClient not initialized");
  return renderToStaticMarkup(React.createElement(ProgressPageClient));
}

describe("ProgressPageClient", () => {
  it("renders loading skeletons", () => {
    useQueryMock.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
    });

    const html = render();

    expect(html).toContain('data-skeleton="true"');
  });

  it("renders an error message", () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error("Failed to load progress."),
    });

    const html = render();

    expect(html).toContain("Failed to load progress.");
  });

  it("uses responsive grid layout (mobile vs desktop)", () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        totalSavedWords: 10,
        dueCount: 2,
        masteredCount: 3,
        reviewedThisWeekCount: 4,
        practiceSummary: { dueCount: 2, reviewedTodayCount: 1, streakDays: 7 },
        wordsByVideo: [],
        savedLast7Days: [
          { day: "2026-07-15", count: 1 },
          { day: "2026-07-16", count: 2 },
          { day: "2026-07-17", count: 3 },
          { day: "2026-07-18", count: 4 },
          { day: "2026-07-19", count: 5 },
          { day: "2026-07-20", count: 6 },
          { day: "2026-07-21", count: 7 },
        ],
      },
      error: null,
    });

    const html = render();

    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain("lg:grid-cols-4");
  });
});

