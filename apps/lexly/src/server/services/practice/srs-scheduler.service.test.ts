import { beforeAll, describe, expect, it } from "vitest";

let computeNextSchedule: typeof import("./srs-scheduler.service").computeNextSchedule;

beforeAll(async () => {
  const mod = await import("./srs-scheduler.service");
  computeNextSchedule = mod.computeNextSchedule;
});

describe("computeNextSchedule", () => {
  it("updates schedule for rating=again", () => {
    const result = computeNextSchedule({
      current: { intervalDays: 3, easeFactor: 2.5, repetitions: 1 },
      rating: "again",
    });

    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.easeFactor).toBeCloseTo(2.3);
  });

  it("updates schedule for rating=hard", () => {
    const result = computeNextSchedule({
      current: { intervalDays: 3, easeFactor: 2.5, repetitions: 1 },
      rating: "hard",
    });

    expect(result.intervalDays).toBe(4);
    expect(result.repetitions).toBe(2);
    expect(result.easeFactor).toBeCloseTo(2.4);
  });

  it("updates schedule for rating=good", () => {
    const result = computeNextSchedule({
      current: { intervalDays: 3, easeFactor: 2.5, repetitions: 1 },
      rating: "good",
    });

    expect(result.intervalDays).toBe(8);
    expect(result.repetitions).toBe(2);
    expect(result.easeFactor).toBeCloseTo(2.5);
  });

  it("updates schedule for rating=easy", () => {
    const result = computeNextSchedule({
      current: { intervalDays: 3, easeFactor: 2.5, repetitions: 1 },
      rating: "easy",
    });

    expect(result.intervalDays).toBe(10);
    expect(result.repetitions).toBe(2);
    expect(result.easeFactor).toBeCloseTo(2.65);
  });
});

