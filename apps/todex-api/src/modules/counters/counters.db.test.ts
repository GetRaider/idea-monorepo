import "reflect-metadata";
import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CreateCounterBodySchema } from "@repo/api/todex";
import type { CreateCounterBody, SetCounterDayBody } from "@repo/api/todex";

import { migrateTestDatabase } from "../../../test/migrate-test-database";
import { users } from "../../db/auth-schema";
import { ensureOwnerWorkspace } from "../../db/ensure-workspace";
import { counterOccurrences, counterPeriods } from "../../db/schema";
import { CountersService } from "./counters.service";

const databaseUrl = process.env.COUNTERS_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("CountersService (database)", () => {
  let pool: Pool;
  let database: NodePgDatabase;
  let service: CountersService;
  let workspaceId = "";
  let otherWorkspaceId = "";

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    database = drizzle(pool);
    await migrateTestDatabase(pool);
    service = new CountersService(database);
    workspaceId = await seedWorkspace(database);
    otherWorkspaceId = await seedWorkspace(database);
  });

  afterAll(async () => {
    await pool.end();
  });

  function create(
    now: string,
    body: Partial<CreateCounterBody> = {},
    workspace = workspaceId,
  ) {
    return service.create(
      workspace,
      CreateCounterBodySchema.parse({
        name: "Gym",
        frequency: "weekly",
        interval: 1,
        target: 4,
        timeZone: "UTC",
        ...body,
      }),
      at(now),
    );
  }

  function mark(
    counterId: string,
    now: string,
    date: string,
    change: SetCounterDayBody = { status: "completed", count: 1 },
  ) {
    return service.setDay(workspaceId, counterId, date, change, at(now));
  }

  function snapshots(counterId: string) {
    return database
      .select()
      .from(counterPeriods)
      .where(eq(counterPeriods.counterId, counterId))
      .orderBy(asc(counterPeriods.startDate));
  }

  it("opens the whole calendar period and allows backdating inside it", async () => {
    // 2026-11-28 is a Saturday.
    const counter = await create("2026-11-28");
    expect(counter.period).toMatchObject({
      start: "2026-11-23",
      end: "2026-11-29",
      isOpen: true,
      completed: 0,
    });
    const marked = await mark(counter.id, "2026-11-28", "2026-11-23");
    expect(marked.period?.completed).toBe(1);
    expect(marked.week.map((day) => day.date)).toContain("2026-11-23");
  });

  it("rejects future days and days before tracking began", async () => {
    const counter = await create("2026-11-28");
    for (const date of ["2026-11-29", "2026-11-22"]) {
      await expect(mark(counter.id, "2026-11-28", date)).rejects.toThrow(
        "tracked days",
      );
    }
  });

  it("limits a period to its Target and a weekly day to one mark", async () => {
    const counter = await create("2026-11-28", { target: 2 });
    await expect(
      mark(counter.id, "2026-11-28", "2026-11-28", {
        status: "completed",
        count: 2,
      }),
    ).rejects.toThrow("at most 1");
    await mark(counter.id, "2026-11-28", "2026-11-28");
    await mark(counter.id, "2026-11-28", "2026-11-27", {
      status: "skipped",
      skipReason: "Sick",
    });
    for (const change of [
      { status: "completed", count: 1 },
      { status: "failed" },
    ] as const) {
      await expect(
        mark(counter.id, "2026-11-28", "2026-11-26", change),
      ).rejects.toThrow("already covered");
    }
  });

  it("repeats the same day without adding marks", async () => {
    const counter = await create("2026-11-27", {
      frequency: "daily",
      target: 3,
    });
    const change = { status: "completed", count: 2 } as const;
    await mark(counter.id, "2026-11-27", "2026-11-27", change);
    const again = await mark(counter.id, "2026-11-27", "2026-11-27", change);
    expect(again.period?.completed).toBe(2);
    expect(again.week[6]).toMatchObject({ fill: "partial", capacity: 3 });
  });

  it("switches a day between completed, failed, skipped and empty", async () => {
    const counter = await create("2026-11-28", { target: 1 });
    const set = (change: SetCounterDayBody) =>
      mark(counter.id, "2026-11-28", "2026-11-28", change);
    expect((await set({ status: "failed" })).period).toMatchObject({
      failed: 1,
      completed: 0,
    });
    expect(
      (await set({ status: "skipped", skipReason: "Rest" })).period,
    ).toMatchObject({ skipped: 1, failed: 0 });
    expect((await set({ status: "completed", count: 1 })).period).toMatchObject(
      { completed: 1, skipped: 0 },
    );
    expect((await set({ status: "empty" })).period).toMatchObject({
      completed: 0,
      skipped: 0,
      failed: 0,
    });
  });

  it("closes a late-started period against the full target", async () => {
    const counter = await create("2026-11-28");
    await mark(counter.id, "2026-11-28", "2026-11-28");
    const next = await service.get(workspaceId, counter.id, at("2026-11-30"));
    expect(await snapshots(counter.id)).toMatchObject([
      {
        startDate: "2026-11-23",
        endDate: "2026-11-29",
        target: 4,
        completed: 1,
        skipped: 0,
        failed: 3,
        outcome: "failed",
      },
    ]);
    const failed = next.history.filter((item) => item.status === "failed");
    expect(failed.map((item) => item.date).sort()).toEqual([
      "2026-11-26",
      "2026-11-27",
      "2026-11-29",
    ]);
    expect(
      next.history.filter((item) => item.deletable).map((item) => item.status),
    ).toEqual(["completed"]);
    expect(next.period).toMatchObject({
      start: "2026-11-30",
      end: "2026-12-06",
      completed: 0,
    });
  });

  it("closes every missed period once, even when run concurrently", async () => {
    const counter = await create("2026-11-01", {
      frequency: "daily",
      target: 1,
    });
    await Promise.all([
      service.closeDue(workspaceId, at("2026-11-05")),
      service.closeDue(workspaceId, at("2026-11-05")),
    ]);
    await service.closeDue(workspaceId, at("2026-11-05"));
    const periods = await snapshots(counter.id);
    expect(periods.map((period) => period.startDate)).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
    ]);
    const occurrences = await database
      .select()
      .from(counterOccurrences)
      .where(eq(counterOccurrences.counterId, counter.id));
    expect(occurrences).toHaveLength(4);
    expect(occurrences.every((item) => item.source === "system")).toBe(true);
  });

  it("resettles a closed day when it is marked later", async () => {
    const counter = await create("2026-11-01", {
      frequency: "daily",
      target: 1,
    });
    await service.get(workspaceId, counter.id, at("2026-11-03"));
    const first = async () => (await snapshots(counter.id))[0];
    const set = (change: SetCounterDayBody) =>
      mark(counter.id, "2026-11-03", "2026-11-01", change);

    await set({ status: "completed", count: 1 });
    expect(await first()).toMatchObject({
      completed: 1,
      failed: 0,
      outcome: "met",
    });
    await set({ status: "skipped", skipReason: "Sick" });
    expect(await first()).toMatchObject({ skipped: 1, outcome: "excused" });
    const cleared = await set({ status: "empty" });
    expect(await first()).toMatchObject({ failed: 1, outcome: "failed" });
    expect(cleared.week.find((day) => day.date === "2026-11-01")).toMatchObject(
      { failed: 1, canComplete: true },
    );
    expect(await snapshots(counter.id)).toHaveLength(2);
  });

  it("moves default fails when an earlier week day is completed", async () => {
    const counter = await create("2026-11-23");
    await service.get(workspaceId, counter.id, at("2026-11-30"));
    await mark(counter.id, "2026-11-30", "2026-11-29");
    const detail = await service.get(workspaceId, counter.id, at("2026-11-30"));
    expect((await snapshots(counter.id))[0]).toMatchObject({
      completed: 1,
      failed: 3,
    });
    expect(
      detail.history
        .filter((item) => item.source === "system")
        .map((item) => item.date),
    ).toEqual(["2026-11-28", "2026-11-27", "2026-11-26"]);
  });

  it("counts total days and the current streak", async () => {
    const counter = await create("2026-11-01", {
      frequency: "daily",
      target: 1,
    });
    await mark(counter.id, "2026-11-01", "2026-11-01");
    await mark(counter.id, "2026-11-02", "2026-11-02");
    const running = await service.get(
      workspaceId,
      counter.id,
      at("2026-11-03"),
    );
    expect(running.stats).toEqual({ totalDays: 2, streak: 2 });
    const failed = await mark(counter.id, "2026-11-03", "2026-11-03", {
      status: "failed",
    });
    expect(failed.stats).toEqual({ totalDays: 2, streak: 0 });
  });

  it("returns the seven days ending on the requested date", async () => {
    const own = await seedWorkspace(database);
    await create("2026-11-01", { frequency: "daily", target: 1 }, own);
    const [counter] = await service.list(
      own,
      "active",
      at("2026-11-20"),
      "2026-11-10",
    );
    expect(counter?.week[0]?.date).toBe("2026-11-04");
    expect(counter?.week[6]?.date).toBe("2026-11-10");
  });

  it("applies a target change from the next period", async () => {
    const counter = await create("2026-11-23");
    const edited = await service.update(
      workspaceId,
      counter.id,
      { target: 2 },
      at("2026-11-24"),
    );
    expect(edited.target).toBe(4);
    expect(edited.pendingChange).toEqual({
      frequency: "weekly",
      interval: 1,
      target: 2,
      effectiveDate: "2026-11-30",
    });
    const next = await service.get(workspaceId, counter.id, at("2026-12-08"));
    expect(next.target).toBe(2);
    expect(next.pendingChange).toBeNull();
    expect((await snapshots(counter.id)).map((item) => item.target)).toEqual([
      4, 2,
    ]);
  });

  it("starts a new recurrence the day after the current period", async () => {
    const counter = await create("2026-11-09");
    await service.update(
      workspaceId,
      counter.id,
      { frequency: "monthly", interval: 1 },
      at("2026-11-10"),
    );
    const next = await service.get(workspaceId, counter.id, at("2026-11-16"));
    expect(next).toMatchObject({
      frequency: "monthly",
      period: { start: "2026-11-16", end: "2026-11-30" },
    });
  });

  it("drops the pending change when edited back to the current values", async () => {
    const counter = await create("2026-11-23");
    await service.update(
      workspaceId,
      counter.id,
      { target: 2 },
      at("2026-11-24"),
    );
    const reverted = await service.update(
      workspaceId,
      counter.id,
      { target: 4, name: "Strength", showInToday: false },
      at("2026-11-24"),
    );
    expect(reverted).toMatchObject({
      pendingChange: null,
      name: "Strength",
      showInToday: false,
    });
  });

  it("keeps history while archived and resumes with the next period", async () => {
    const counter = await create("2026-11-03", {
      frequency: "daily",
      target: 1,
    });
    await mark(counter.id, "2026-11-03", "2026-11-03");
    const archived = await service.archive(
      workspaceId,
      counter.id,
      at("2026-11-03"),
    );
    expect(archived.period).toBeNull();
    await expect(mark(counter.id, "2026-11-03", "2026-11-03")).rejects.toThrow(
      "Restore",
    );
    await service.closeDue(workspaceId, at("2026-11-09"));
    expect(await snapshots(counter.id)).toHaveLength(0);

    await service.update(
      workspaceId,
      counter.id,
      { target: 3 },
      at("2026-11-09"),
    );
    const restored = await service.restore(
      workspaceId,
      counter.id,
      at("2026-11-10"),
    );
    expect(restored).toMatchObject({
      target: 3,
      pendingChange: null,
      period: { start: "2026-11-11", end: "2026-11-11", isOpen: false },
    });
    expect(restored.history).toHaveLength(1);
    await expect(mark(counter.id, "2026-11-10", "2026-11-10")).rejects.toThrow(
      "tracked days",
    );
    await mark(counter.id, "2026-11-11", "2026-11-11");
    expect(await snapshots(counter.id)).toHaveLength(0);
  });

  it("removes any mark except a default fail", async () => {
    const counter = await create("2026-11-23", { target: 2 });
    await mark(counter.id, "2026-11-23", "2026-11-23");
    const closed = await service.get(workspaceId, counter.id, at("2026-11-30"));
    const failed = closed.history.find((item) => item.source === "system");
    await expect(
      service.deleteOccurrence(
        workspaceId,
        counter.id,
        failed?.id ?? "",
        at("2026-11-30"),
      ),
    ).rejects.toThrow("default fail");
    const logged = closed.history.find((item) => item.source === "manual");
    await service.deleteOccurrence(
      workspaceId,
      counter.id,
      logged?.id ?? "",
      at("2026-11-30"),
    );
    expect((await snapshots(counter.id))[0]).toMatchObject({
      completed: 0,
      failed: 2,
    });
  });

  it("dates occurrences in the Counter time zone", async () => {
    const counter = await create("2026-11-27T22:30:00Z", {
      frequency: "daily",
      target: 1,
      timeZone: "Europe/Kyiv",
    });
    expect(counter.today).toBe("2026-11-28");
    const marked = await mark(counter.id, "2026-11-27T22:30:00Z", "2026-11-28");
    expect(marked.week[6]).toMatchObject({
      date: "2026-11-28",
      completed: 1,
    });
  });

  it("lists by status", async () => {
    const own = await seedWorkspace(database);
    const first = await create("2026-11-23", { name: "A" }, own);
    const second = await create("2026-11-23", { name: "B" }, own);
    await service.archive(own, second.id, at("2026-11-23"));
    const active = await service.list(own, "active", at("2026-11-23"));
    const archived = await service.list(own, "archived", at("2026-11-23"));
    expect(active.map((item) => item.id)).toEqual([first.id]);
    expect(archived.map((item) => item.id)).toEqual([second.id]);
  });

  it("hides Counters from other workspaces", async () => {
    const counter = await create("2026-11-23");
    const now = at("2026-11-23");
    await expect(
      service.get(otherWorkspaceId, counter.id, now),
    ).rejects.toThrow("Counter not found");
    await expect(
      service.setDay(
        otherWorkspaceId,
        counter.id,
        "2026-11-23",
        { status: "failed" },
        now,
      ),
    ).rejects.toThrow("Counter not found");
    await expect(
      create("2026-11-23", { spaceId: randomUUID() }),
    ).rejects.toThrow("Space not found");
    await expect(
      service.archive(otherWorkspaceId, counter.id, now),
    ).rejects.toThrow("Counter not found");
  });
});

async function seedWorkspace(database: NodePgDatabase) {
  const userId = randomUUID();
  await database.insert(users).values({
    id: userId,
    name: "Counter tester",
    email: `counters-${userId}@example.com`,
  });
  const member = await ensureOwnerWorkspace(database, userId, "Counter tester");
  if (!member) throw new Error("Workspace seed failed");
  return member.workspaceId;
}

function at(value: string) {
  return new Date(value.includes("T") ? value : `${value}T12:00:00Z`);
}
