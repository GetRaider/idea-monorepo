import "reflect-metadata";
import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CreateCounterBodySchema } from "@repo/api/todex";
import type { CreateCounterBody } from "@repo/api/todex";

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
    await migrate(database, { migrationsFolder: "drizzle" });
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

  function log(
    counterId: string,
    now: string,
    date?: string,
    skipReason?: string,
  ) {
    return service.logOccurrence(
      workspaceId,
      counterId,
      skipReason === undefined
        ? { status: "completed", date }
        : { status: "skipped", date, skipReason },
      at(now),
    );
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
    const result = await log(counter.id, "2026-11-28", "2026-11-23");
    expect(result.counter.period?.completed).toBe(1);
    expect(result.counter.week[0]?.fill).toBe("filled");
  });

  it("rejects future days and closed periods", async () => {
    const counter = await create("2026-11-28");
    await expect(log(counter.id, "2026-11-28", "2026-11-29")).rejects.toThrow(
      "open period",
    );
    await expect(log(counter.id, "2026-11-28", "2026-11-22")).rejects.toThrow(
      "open period",
    );
  });

  it("blocks a skip once the target is covered but keeps completions open", async () => {
    const counter = await create("2026-11-28", { target: 2 });
    await log(counter.id, "2026-11-28");
    await log(counter.id, "2026-11-28", undefined, "Sick");
    await expect(
      log(counter.id, "2026-11-28", undefined, "Again"),
    ).rejects.toThrow("Target");
    await log(counter.id, "2026-11-28");
    const over = await log(counter.id, "2026-11-28");
    expect(over.counter.period).toMatchObject({ completed: 3, skipped: 1 });
  });

  it("closes a late-started period against the full target", async () => {
    const counter = await create("2026-11-28");
    await log(counter.id, "2026-11-28");
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
    expect(next.history.some((item) => item.deletable)).toBe(false);
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
    await log(counter.id, "2026-11-03");
    const archived = await service.archive(
      workspaceId,
      counter.id,
      at("2026-11-03"),
    );
    expect(archived.period).toBeNull();
    await expect(log(counter.id, "2026-11-03")).rejects.toThrow("Restore");
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
    await expect(log(counter.id, "2026-11-10")).rejects.toThrow("open period");
    await log(counter.id, "2026-11-11");
    expect(await snapshots(counter.id)).toHaveLength(0);
  });

  it("deletes only manual occurrences of the open period", async () => {
    const counter = await create("2026-11-23", { target: 2 });
    const logged = await log(counter.id, "2026-11-23");
    const removed = await service.deleteOccurrence(
      workspaceId,
      counter.id,
      logged.occurrenceId,
      at("2026-11-23"),
    );
    expect(removed.period?.completed).toBe(0);

    const kept = await log(counter.id, "2026-11-23");
    const closed = await service.get(workspaceId, counter.id, at("2026-11-30"));
    const failed = closed.history.find((item) => item.status === "failed");
    for (const occurrenceId of [kept.occurrenceId, failed?.id ?? ""]) {
      await expect(
        service.deleteOccurrence(
          workspaceId,
          counter.id,
          occurrenceId,
          at("2026-11-30"),
        ),
      ).rejects.toThrow();
    }
  });

  it("dates occurrences in the Counter time zone", async () => {
    const counter = await create("2026-11-27T22:30:00Z", {
      frequency: "daily",
      target: 1,
      timeZone: "Europe/Kyiv",
    });
    expect(counter.today).toBe("2026-11-28");
    const logged = await log(counter.id, "2026-11-27T22:30:00Z");
    expect(logged.counter.week.find((day) => day.completed === 1)?.date).toBe(
      "2026-11-28",
    );
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
      service.logOccurrence(
        otherWorkspaceId,
        counter.id,
        { status: "completed" },
        now,
      ),
    ).rejects.toThrow("Counter not found");
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
