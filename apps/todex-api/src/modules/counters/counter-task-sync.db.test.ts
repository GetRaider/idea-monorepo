import "reflect-metadata";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addDaysToDate,
  CreateCounterBodySchema,
  CreateTaskBodySchema,
  TaskStatus,
} from "@repo/api/todex";

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
import { localDate } from "./counter-periods";
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
    await migrate(database, { migrationsFolder: "drizzle" });
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

  function createCounter(now = new Date()) {
    return counterService.create(
      workspaceId,
      CreateCounterBodySchema.parse({
        name: "Review",
        frequency: "daily",
        interval: 1,
        target: 1,
        timeZone: "UTC",
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
          deletable: false,
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
    const { counter, task } = await linkedTask();
    await counterService.logOccurrence(workspaceId, counter.id, {
      status: "completed",
    });
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
    const { counter, task } = await linkedTask();
    await counterService.logOccurrence(workspaceId, counter.id, {
      status: "completed",
    });
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

  it("records a re-completion after the first period closed", async () => {
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
