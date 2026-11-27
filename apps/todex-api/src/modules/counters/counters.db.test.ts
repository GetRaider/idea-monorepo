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
import { counterDays, counterOccurrences } from "../../db/schema";
import { CountersService } from "./counters.service";

const databaseUrl = process.env.COUNTERS_TEST_DATABASE_URL;

const EVERY_DAY = { frequency: "daily", interval: 1 } as const;

const MON_WED_FRI: CreateCounterBody["schedule"] = {
  frequency: "weekly",
  interval: 1,
  weekdays: ["MO", "WE", "FR"],
};

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
        schedule: EVERY_DAY,
        target: 1,
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

  function read(counterId: string, now: string) {
    return service.get(workspaceId, counterId, at(now));
  }

  function savedDays(counterId: string) {
    return database
      .select()
      .from(counterDays)
      .where(eq(counterDays.counterId, counterId))
      .orderBy(asc(counterDays.localDate));
  }

  function occurrencesOf(counterId: string) {
    return database
      .select()
      .from(counterOccurrences)
      .where(eq(counterOccurrences.counterId, counterId));
  }

  it("opens today and lets earlier days be marked, even before creation", async () => {
    const counter = await create("2026-11-28");
    expect(counter.progress).toEqual({
      today: { completed: 0, target: 1 },
      nextDate: "2026-11-29",
    });
    // Marking a later day never locks the earlier ones.
    for (const date of ["2026-11-28", "2026-11-27", "2026-11-22"]) {
      await mark(counter.id, "2026-11-28", date);
    }
    const detail = await read(counter.id, "2026-11-28");
    expect(detail.stats.totalDays).toBe(3);
    expect(detail.week.every((day) => day.loggable)).toBe(true);
    expect(await savedDays(counter.id)).toMatchObject([
      { localDate: "2026-11-22", required: false, outcome: "met" },
      { localDate: "2026-11-27", required: false, outcome: "met" },
    ]);
  });

  it("rejects future days and days off the schedule", async () => {
    // 2026-11-27 is a Friday.
    const counter = await create("2026-11-27", { schedule: MON_WED_FRI });
    for (const date of ["2026-11-30", "2026-11-26"]) {
      await expect(mark(counter.id, "2026-11-27", date)).rejects.toThrow(
        "scheduled days",
      );
    }
    const marked = await mark(counter.id, "2026-11-27", "2026-11-25");
    expect(marked.week.map((day) => day.tracked)).toEqual([
      false,
      false,
      true,
      false,
      true,
      false,
      true,
    ]);
  });

  it("limits a day to its target and repeats without adding marks", async () => {
    const counter = await create("2026-11-27", { target: 3 });
    await expect(
      mark(counter.id, "2026-11-27", "2026-11-27", {
        status: "completed",
        count: 4,
      }),
    ).rejects.toThrow("at most 3");
    const change = { status: "completed", count: 2 } as const;
    await mark(counter.id, "2026-11-27", "2026-11-27", change);
    const again = await mark(counter.id, "2026-11-27", "2026-11-27", change);
    expect(again.progress.today).toEqual({ completed: 2, target: 3 });
    expect(again.week[6]).toMatchObject({ fill: "partial", capacity: 3 });
    expect(again.stats.totalDays).toBe(0);
  });

  it("switches a day between completed, failed, skipped and empty", async () => {
    const counter = await create("2026-11-28");
    const set = async (change: SetCounterDayBody) =>
      (await mark(counter.id, "2026-11-28", "2026-11-28", change)).week[6];
    expect(await set({ status: "failed" })).toMatchObject({
      failed: 1,
      completed: 0,
    });
    expect(await set({ status: "skipped", skipReason: "Rest" })).toMatchObject({
      skipped: 1,
      failed: 0,
    });
    expect(await set({ status: "completed", count: 1 })).toMatchObject({
      completed: 1,
      skipped: 0,
    });
    expect(await set({ status: "empty" })).toMatchObject({
      completed: 0,
      skipped: 0,
      failed: 0,
    });
  });

  it("closes every missed scheduled day once, even when run concurrently", async () => {
    // 2026-11-23 is a Monday.
    const counter = await create("2026-11-23", { schedule: MON_WED_FRI });
    await Promise.all([
      service.closeDue(workspaceId, at("2026-11-28")),
      service.closeDue(workspaceId, at("2026-11-28")),
    ]);
    await service.closeDue(workspaceId, at("2026-11-28"));
    expect((await savedDays(counter.id)).map((day) => day.localDate)).toEqual([
      "2026-11-23",
      "2026-11-25",
      "2026-11-27",
    ]);
    const occurrences = await occurrencesOf(counter.id);
    expect(occurrences).toHaveLength(3);
    expect(occurrences.every((item) => item.source === "system")).toBe(true);
  });

  it("fails the untouched part of a part-done day", async () => {
    const counter = await create("2026-11-27", { target: 3 });
    await mark(counter.id, "2026-11-27", "2026-11-27");
    await read(counter.id, "2026-11-28");
    expect(await savedDays(counter.id)).toMatchObject([
      {
        localDate: "2026-11-27",
        required: true,
        completed: 1,
        failed: 2,
        outcome: "failed",
      },
    ]);
  });

  it("never fails a day from before the Counter existed", async () => {
    const counter = await create("2026-11-27");
    await mark(counter.id, "2026-11-30", "2026-11-24", {
      status: "skipped",
      skipReason: "Away",
    });
    expect((await savedDays(counter.id)).map((day) => day.localDate)).toEqual([
      "2026-11-24",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
    await mark(counter.id, "2026-11-30", "2026-11-24", { status: "empty" });
    expect(await savedDays(counter.id)).toHaveLength(3);
    expect(
      (await occurrencesOf(counter.id)).map((item) => item.localDate).sort(),
    ).toEqual(["2026-11-27", "2026-11-28", "2026-11-29"]);
  });

  it("resettles a closed day when it is marked later", async () => {
    const counter = await create("2026-11-01");
    await read(counter.id, "2026-11-03");
    const first = async () => (await savedDays(counter.id))[0];
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
    await set({ status: "empty" });
    expect(await first()).toMatchObject({ failed: 1, outcome: "failed" });
    expect(await savedDays(counter.id)).toHaveLength(2);
  });

  it("counts total days and the current streak", async () => {
    const counter = await create("2026-11-01");
    await mark(counter.id, "2026-11-01", "2026-11-01");
    await mark(counter.id, "2026-11-02", "2026-11-02");
    const running = await read(counter.id, "2026-11-03");
    expect(running.stats).toEqual({ totalDays: 2, streak: 2 });
    const failed = await mark(counter.id, "2026-11-03", "2026-11-03", {
      status: "failed",
    });
    expect(failed.stats).toEqual({ totalDays: 2, streak: 0 });
  });

  it("breaks a backfilled streak at an unmarked day", async () => {
    const counter = await create("2026-11-10");
    await mark(counter.id, "2026-11-10", "2026-11-09");
    const marked = await mark(counter.id, "2026-11-10", "2026-11-07");
    expect(marked.stats).toEqual({ totalDays: 2, streak: 1 });
  });

  it("returns the seven days ending on the requested date", async () => {
    const own = await seedWorkspace(database);
    await create("2026-11-01", {}, own);
    const [past] = await service.list(
      own,
      "active",
      at("2026-11-20"),
      "2026-11-10",
    );
    expect(past?.week[0]?.date).toBe("2026-11-04");
    expect(past?.week[6]?.date).toBe("2026-11-10");
    const [ahead] = await service.list(
      own,
      "active",
      at("2026-11-20"),
      "2026-11-21",
    );
    expect(ahead?.week[6]).toMatchObject({
      date: "2026-11-21",
      tracked: true,
      loggable: false,
    });
  });

  it("applies a change from tomorrow while today is open", async () => {
    const counter = await create("2026-11-23");
    const edited = await service.update(
      workspaceId,
      counter.id,
      { target: 3 },
      at("2026-11-24"),
    );
    expect(edited.target).toBe(1);
    expect(edited.pendingChange).toEqual({
      schedule: EVERY_DAY,
      target: 3,
      effectiveDate: "2026-11-25",
    });
    const next = await read(counter.id, "2026-11-26");
    expect(next.target).toBe(3);
    expect(next.pendingChange).toBeNull();
    expect((await savedDays(counter.id)).map((day) => day.target)).toEqual([
      1, 1, 3,
    ]);
  });

  it("lets a waiting schedule decide tomorrow", async () => {
    const own = await seedWorkspace(database);
    const counter = await create("2026-11-27", {}, own);
    await service.update(
      own,
      counter.id,
      { schedule: MON_WED_FRI },
      at("2026-11-27"),
    );
    const [listed] = await service.list(
      own,
      "active",
      at("2026-11-27"),
      "2026-11-28",
    );
    expect(listed?.week[6]?.tracked).toBe(false);
    expect(listed?.progress).toEqual({
      today: { completed: 0, target: 1 },
      nextDate: "2026-11-30",
    });
  });

  it("applies a change at once when today is not scheduled", async () => {
    // 2026-11-28 is a Saturday.
    const counter = await create("2026-11-28", { schedule: MON_WED_FRI });
    const edited = await service.update(
      workspaceId,
      counter.id,
      { schedule: EVERY_DAY, target: 2 },
      at("2026-11-28"),
    );
    expect(edited).toMatchObject({ target: 2, pendingChange: null });
    expect(edited.progress.today).toEqual({ completed: 0, target: 2 });
  });

  it("drops the pending change when edited back to the current values", async () => {
    const counter = await create("2026-11-23");
    await service.update(
      workspaceId,
      counter.id,
      { target: 2 },
      at("2026-11-23"),
    );
    const reverted = await service.update(
      workspaceId,
      counter.id,
      { target: 1, name: "Strength", showInToday: false },
      at("2026-11-23"),
    );
    expect(reverted).toMatchObject({
      pendingChange: null,
      name: "Strength",
      showInToday: false,
    });
  });

  it("keeps history while archived and fails nothing from that time", async () => {
    const counter = await create("2026-11-03");
    await mark(counter.id, "2026-11-03", "2026-11-03");
    const archived = await service.archive(
      workspaceId,
      counter.id,
      at("2026-11-03"),
    );
    expect(archived.progress).toEqual({ today: null, nextDate: null });
    await expect(mark(counter.id, "2026-11-03", "2026-11-03")).rejects.toThrow(
      "Restore",
    );
    await service.closeDue(workspaceId, at("2026-11-09"));
    expect(await savedDays(counter.id)).toMatchObject([
      { localDate: "2026-11-03", required: false, outcome: "met" },
    ]);

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
    expect(restored).toMatchObject({ target: 3, pendingChange: null });
    expect(restored.progress.today).toEqual({ completed: 0, target: 3 });
    expect(restored.history).toHaveLength(1);
    await mark(counter.id, "2026-11-10", "2026-11-10");
    await read(counter.id, "2026-11-12");
    expect(await savedDays(counter.id)).toMatchObject([
      { localDate: "2026-11-03" },
      { localDate: "2026-11-10", required: false, failed: 0 },
      { localDate: "2026-11-11", required: true, failed: 3 },
    ]);
  });

  it("removes any mark except a default fail", async () => {
    const counter = await create("2026-11-23", { target: 2 });
    await mark(counter.id, "2026-11-23", "2026-11-23");
    const closed = await read(counter.id, "2026-11-24");
    const failed = closed.history.find((item) => item.source === "system");
    await expect(
      service.deleteOccurrence(
        workspaceId,
        counter.id,
        failed?.id ?? "",
        at("2026-11-24"),
      ),
    ).rejects.toThrow("default fail");
    const logged = closed.history.find((item) => item.source === "manual");
    await service.deleteOccurrence(
      workspaceId,
      counter.id,
      logged?.id ?? "",
      at("2026-11-24"),
    );
    expect((await savedDays(counter.id))[0]).toMatchObject({
      completed: 0,
      failed: 2,
    });
  });

  it("schedules a monthly day on the last day of a short month", async () => {
    const counter = await create("2026-11-27", {
      schedule: { frequency: "monthly", monthDay: 31 },
    });
    expect(counter.progress).toEqual({ today: null, nextDate: "2026-11-30" });
  });

  it("dates occurrences in the Counter time zone", async () => {
    const counter = await create("2026-11-27T22:30:00Z", {
      timeZone: "Europe/Kyiv",
    });
    expect(counter.today).toBe("2026-11-28");
    const marked = await mark(counter.id, "2026-11-27T22:30:00Z", "2026-11-28");
    expect(marked.week[6]).toMatchObject({
      date: "2026-11-28",
      completed: 1,
    });
  });

  it("lists in position order and moves a Counter between spaces", async () => {
    const own = await seedWorkspace(database);
    const first = await create("2026-11-23", { name: "A" }, own);
    const second = await create("2026-11-23", { name: "B" }, own);
    const names = async () =>
      (await service.list(own, "active", at("2026-11-23"))).map(
        (item) => item.name,
      );
    expect(second.position).toBeGreaterThan(first.position);
    expect(await names()).toEqual(["A", "B"]);

    const moved = await service.update(
      own,
      second.id,
      { position: first.position - 1 },
      at("2026-11-23"),
    );
    expect(moved.spaceId).toBeNull();
    expect(await names()).toEqual(["B", "A"]);
    await expect(
      service.update(
        own,
        second.id,
        { spaceId: randomUUID(), position: 0 },
        at("2026-11-23"),
      ),
    ).rejects.toThrow("Space not found");
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
