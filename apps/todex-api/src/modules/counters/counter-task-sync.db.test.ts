import "reflect-metadata";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addDaysToDate,
  CreateCounterBodySchema,
  CreateTaskBodySchema,
  TASK_WEEKDAYS,
  TaskStatus,
} from "@repo/api/todex";

import { migrateTestDatabase } from "../../../test/migrate-test-database";
import { users } from "../../db/auth-schema";
import { ensureOwnerWorkspace } from "../../db/ensure-workspace";
import { tasks } from "../../db/schema";
import { EpicsService } from "../epics/epics.service";
import { SpaceFoldersService } from "../folders/space-folders.service";
import { RelationsService } from "../relations/relations.service";
import { SpacesService } from "../spaces/spaces.service";
import { RecurrenceService } from "../tasks/recurrence.service";
import { TasksService } from "../tasks/tasks.service";
import { WorkspaceService } from "../workspace/workspace.service";
import { localDate } from "./counter-schedule";
import { recordTaskCompletion } from "./counter-task-sync";
import { CountersService } from "./counters.service";

const databaseUrl = process.env.COUNTERS_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("Counter task integration (database)", () => {
  let pool: Pool;
  let database: NodePgDatabase;
  let counterService: CountersService;
  let spacesService: SpacesService;
  let taskService: TasksService;
  let recurrenceService: RecurrenceService;
  let userId = "";
  let workspaceId = "";
  let spaceId = "";

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    database = drizzle(pool);
    await migrateTestDatabase(pool);
    const workspaceService = new WorkspaceService(database);
    const relations = new RelationsService(database);
    spacesService = new SpacesService(
      database,
      workspaceService,
      new SpaceFoldersService(database, workspaceService),
      relations,
    );
    recurrenceService = new RecurrenceService(database);
    taskService = new TasksService(
      database,
      spacesService,
      new EpicsService(database, spacesService, relations),
      relations,
      workspaceService,
      undefined,
      recurrenceService,
    );
    counterService = new CountersService(database);
    userId = randomUUID();
    await database.insert(users).values({
      id: userId,
      name: "Sync tester",
      email: `counter-sync-${userId}@example.com`,
    });
    const member = await ensureOwnerWorkspace(database, userId, "Sync tester");
    if (!member) throw new Error("Workspace seed failed");
    workspaceId = member.workspaceId;
    spaceId = (await spacesService.create(workspaceId, { name: "Sync" })).id;
  });

  afterAll(async () => {
    await pool.end();
  });

  function createCounter(
    now = new Date(),
    extra: Record<string, unknown> = {},
  ) {
    return counterService.create(
      workspaceId,
      CreateCounterBodySchema.parse({
        name: "Review",
        schedule: { frequency: "daily", interval: 1 },
        target: 1,
        timeZone: "UTC",
        ...extra,
      }),
      now,
    );
  }

  function createTask(extra: Record<string, unknown> = {}) {
    return taskService.create(
      workspaceId,
      CreateTaskBodySchema.parse({
        spaceId,
        summary: "Weekly review",
        estimation: 30,
        ...extra,
      }),
      userId,
    );
  }

  async function linkedTask(extra: Record<string, unknown> = {}) {
    const counter = await createCounter();
    const task = await createTask(extra);
    await counterService.addLink(workspaceId, counter.id, task.id);
    return { counter, task };
  }

  async function currentTask(taskId: string) {
    return taskService.get(workspaceId, taskId);
  }

  async function setStatus(taskId: string, status: TaskStatus) {
    const task = await currentTask(taskId);
    await taskService.update(workspaceId, taskId, {
      status,
      version: task.version,
      transitionId: randomUUID(),
    });
  }

  async function removeTask(taskId: string) {
    const task = await currentTask(taskId);
    await taskService.remove(workspaceId, taskId, {
      version: task.version,
      transitionId: randomUUID(),
    });
  }

  function completeByHand(counterId: string) {
    return counterService.setDay(
      workspaceId,
      counterId,
      localDate(new Date(), "UTC"),
      { status: "completed", count: 1 },
    );
  }

  async function newSpace() {
    const space = await spacesService.create(workspaceId, {
      name: `Space ${randomUUID()}`,
    });
    return space.id;
  }

  async function history(counterId: string) {
    return (await counterService.get(workspaceId, counterId)).history;
  }

  it("records one completion in every linked Counter", async () => {
    const { counter, task } = await linkedTask();
    const second = await createCounter();
    const archived = await createCounter();
    await counterService.addLink(workspaceId, second.id, task.id);
    await counterService.addLink(workspaceId, archived.id, task.id);
    await counterService.archive(workspaceId, archived.id);

    await setStatus(task.id, TaskStatus.DONE);
    await setStatus(task.id, TaskStatus.DONE);

    for (const counterId of [counter.id, second.id]) {
      expect(await history(counterId)).toMatchObject([
        {
          status: "completed",
          source: "task",
          taskId: task.id,
          date: localDate(new Date(), "UTC"),
          deletable: true,
        },
      ]);
    }
    expect(await history(archived.id)).toHaveLength(0);
  });

  it("records a completion made by moving the card to Done", async () => {
    const { counter, task } = await linkedTask();
    await taskService.move(workspaceId, task.id, {
      status: TaskStatus.DONE,
      version: task.version,
      transitionId: randomUUID(),
    });
    expect(await history(counter.id)).toHaveLength(1);

    const done = await currentTask(task.id);
    await taskService.move(workspaceId, task.id, {
      status: TaskStatus.TODO,
      version: done.version,
    });
    expect(await history(counter.id)).toHaveLength(0);
  });

  it("removes the completion on reopen and records a new one afterwards", async () => {
    const counter = await createCounter(new Date(), { target: 2 });
    const task = await createTask();
    await counterService.addLink(workspaceId, counter.id, task.id);
    await completeByHand(counter.id);
    await setStatus(task.id, TaskStatus.DONE);
    await setStatus(task.id, TaskStatus.IN_PROGRESS);
    expect(await history(counter.id)).toMatchObject([{ source: "manual" }]);
    await setStatus(task.id, TaskStatus.DONE);
    expect(await history(counter.id)).toHaveLength(2);
  });

  it("removes the completion when a Done Task is cancelled", async () => {
    const { counter, task } = await linkedTask();
    await setStatus(task.id, TaskStatus.DONE);
    await setStatus(task.id, TaskStatus.CANCELLED);
    expect(await history(counter.id)).toHaveLength(0);
  });

  it("records nothing when an open Task is cancelled", async () => {
    const { counter, task } = await linkedTask();
    await setStatus(task.id, TaskStatus.CANCELLED);
    expect(await history(counter.id)).toHaveLength(0);
  });

  it("removes the completion of a deleted Task and keeps manual entries", async () => {
    const counter = await createCounter(new Date(), { target: 2 });
    const task = await createTask();
    await counterService.addLink(workspaceId, counter.id, task.id);
    await completeByHand(counter.id);
    await setStatus(task.id, TaskStatus.DONE);
    await removeTask(task.id);
    const detail = await counterService.get(workspaceId, counter.id);
    expect(detail.history).toMatchObject([{ source: "manual" }]);
    expect(detail.links).toHaveLength(0);
  });

  it("removes a subtask completion when the parent is deleted", async () => {
    const parent = await createTask();
    const { counter, task } = await linkedTask({ parentTaskId: parent.id });
    await setStatus(task.id, TaskStatus.DONE);
    await removeTask(parent.id);
    expect(await history(counter.id)).toHaveLength(0);
  });

  it("removes completions when a space is deleted", async () => {
    const doomed = await spacesService.create(workspaceId, { name: "Doomed" });
    const { counter, task } = await linkedTask({ spaceId: doomed.id });
    await setStatus(task.id, TaskStatus.DONE);
    await spacesService.remove(workspaceId, doomed.id);
    expect(await history(counter.id)).toHaveLength(0);
  });

  it("keeps closed history on reopen and delete, and counts a new completion", async () => {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const counter = await createCounter(weekAgo);
    const task = await createTask();
    await counterService.addLink(workspaceId, counter.id, task.id, weekAgo);
    const [row] = await database
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task.id), eq(tasks.workspaceId, workspaceId)));
    if (!row) throw new Error("Task missing");
    await database.transaction((tx) => recordTaskCompletion(tx, row, weekAgo));
    await setStatus(task.id, TaskStatus.DONE);
    const pastDate = localDate(weekAgo, "UTC");

    await setStatus(task.id, TaskStatus.TODO);
    const reopened = await history(counter.id);
    expect(
      reopened.filter((item) => item.status === "completed"),
    ).toMatchObject([{ date: pastDate, source: "task", taskId: null }]);

    await setStatus(task.id, TaskStatus.DONE);
    await removeTask(task.id);
    const kept = (await history(counter.id)).filter(
      (item) => item.status === "completed",
    );
    expect(kept).toMatchObject([{ date: pastDate }]);
  });

  it("records a re-completion after the first day closed", async () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const counter = await createCounter(yesterday);
    const task = await createTask();
    await counterService.addLink(workspaceId, counter.id, task.id, yesterday);
    const [row] = await database
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id));
    if (!row) throw new Error("Task missing");
    await database.transaction((tx) =>
      recordTaskCompletion(tx, row, yesterday),
    );
    await setStatus(task.id, TaskStatus.DONE);
    await setStatus(task.id, TaskStatus.TODO);
    await setStatus(task.id, TaskStatus.DONE);
    const today = localDate(new Date(), "UTC");
    expect(
      (await history(counter.id))
        .filter((item) => item.status === "completed")
        .map((item) => item.date),
    ).toEqual([today, addDaysToDate(today, -1)]);
  });

  it("links a series Task through its series, even after the series is deleted", async () => {
    const task = await createTask({
      recurrence: {
        frequency: "daily",
        interval: 1,
        timeZone: "UTC",
        end: { type: "never" },
      },
    });
    const seriesId = task.seriesId;
    if (!seriesId) throw new Error("Series missing");
    const counter = await createCounter();
    const linked = await counterService.addLink(
      workspaceId,
      counter.id,
      task.id,
    );
    expect(linked.links).toMatchObject([{ kind: "series", seriesId }]);
    await recurrenceService.deleteSeries(workspaceId, seriesId);
    await setStatus(task.id, TaskStatus.DONE);
    expect(await history(counter.id)).toHaveLength(1);
  });

  it("moves a Task link to the series when the Task starts repeating", async () => {
    const { counter, task } = await linkedTask();
    await recurrenceService.createSeries(workspaceId, task.id, new Date());
    const detail = await counterService.get(workspaceId, counter.id);
    expect(detail.links).toMatchObject([
      { kind: "series", taskId: null, title: "Weekly review" },
    ]);
  });

  it("counts any Task of the Counter's space when asked to", async () => {
    const watched = await newSpace();
    const counter = await createCounter(new Date(), {
      target: 3,
      spaceId: watched,
      countsSpaceTasks: true,
    });
    const parent = await createTask({ spaceId: watched });
    const child = await createTask({
      spaceId: watched,
      parentTaskId: parent.id,
    });
    const elsewhere = await createTask({ spaceId: await newSpace() });
    for (const task of [child, parent, elsewhere]) {
      await setStatus(task.id, TaskStatus.DONE);
    }
    expect(
      (await history(counter.id)).map((item) => item.taskId).sort(),
    ).toEqual([parent.id, child.id].sort());
    await counterService.update(workspaceId, counter.id, {
      countsSpaceTasks: false,
    });
    const later = await createTask({ spaceId: watched });
    await setStatus(later.id, TaskStatus.DONE);
    expect(await history(counter.id)).toHaveLength(2);
  });

  it("never lets Task completions exceed the day's target", async () => {
    const busy = await newSpace();
    const counter = await createCounter(new Date(), {
      target: 2,
      spaceId: busy,
      countsSpaceTasks: true,
    });
    for (let index = 0; index < 3; index += 1) {
      const task = await createTask({ spaceId: busy });
      await setStatus(task.id, TaskStatus.DONE);
    }
    expect(await history(counter.id)).toHaveLength(2);
  });

  it("ignores a Task completed on a day off the schedule", async () => {
    const notToday = TASK_WEEKDAYS[(new Date().getUTCDay() + 1) % 7];
    const counter = await createCounter(new Date(), {
      schedule: { frequency: "weekly", interval: 1, weekdays: [notToday] },
    });
    const task = await createTask();
    await counterService.addLink(workspaceId, counter.id, task.id);
    await setStatus(task.id, TaskStatus.DONE);
    expect(await history(counter.id)).toHaveLength(0);
  });

  it("replaces a hand-set skip with a Task completion", async () => {
    const { counter, task } = await linkedTask();
    await counterService.setDay(
      workspaceId,
      counter.id,
      localDate(new Date(), "UTC"),
      { status: "skipped", skipReason: "Busy" },
    );
    await setStatus(task.id, TaskStatus.DONE);
    expect(await history(counter.id)).toMatchObject([
      { status: "completed", source: "task" },
    ]);
  });

  it("leaves a Counter space-free when its space is deleted", async () => {
    const doomed = await newSpace();
    const counter = await createCounter(new Date(), {
      spaceId: doomed,
      countsSpaceTasks: true,
    });
    await completeByHand(counter.id);
    await spacesService.remove(workspaceId, doomed);
    const detail = await counterService.get(workspaceId, counter.id);
    expect(detail).toMatchObject({ spaceId: null, countsSpaceTasks: false });
    expect(detail.history).toHaveLength(1);
  });

  it("ignores duplicate links and rejects another workspace's Task", async () => {
    const { counter, task } = await linkedTask();
    const again = await counterService.addLink(
      workspaceId,
      counter.id,
      task.id,
    );
    expect(again.links).toHaveLength(1);
    await expect(
      counterService.addLink(workspaceId, counter.id, randomUUID()),
    ).rejects.toThrow("Task not found");
    const removed = await counterService.removeLink(
      workspaceId,
      counter.id,
      again.links[0]?.id ?? "",
    );
    expect(removed.links).toHaveLength(0);
  });
});
