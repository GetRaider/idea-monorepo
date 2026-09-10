import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { WorkspaceGuard } from "../src/guards/workspace.guard";
import { TasksController } from "../src/modules/tasks/tasks.controller";
import { TasksService } from "../src/modules/tasks/tasks.service";

describe("TasksController (e2e smoke)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            list: async () => [],
            create: async () => ({ id: "t1" }),
            update: async () => ({ id: "t1" }),
            remove: async () => undefined,
          },
        },
      ],
    })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("rejects unauthenticated list", async () => {
    const response = await request(app.getHttpServer() as Server).get(
      "/tasks?boardId=board-1",
    );
    expect(response.status).toBeGreaterThanOrEqual(403);
  });
});

describe("TasksController list query (e2e)", () => {
  let app: INestApplication;
  const scheduleFrom = "2026-09-10T00:00:00.000Z";
  const scheduleTo = "2026-09-11T00:00:00.000Z";

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            list: async () => [],
            create: async () => ({ id: "t1" }),
            update: async () => ({ id: "t1" }),
            remove: async () => undefined,
          },
        },
      ],
    })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 400 when neither boardId nor schedule range is provided", async () => {
    const response = await request(app.getHttpServer() as Server).get("/tasks");
    expect(response.status).toBe(400);
  });

  it("returns 400 when boardId and schedule range are both provided", async () => {
    const response = await request(app.getHttpServer() as Server).get(
      `/tasks?boardId=board-1&scheduleFrom=${encodeURIComponent(scheduleFrom)}&scheduleTo=${encodeURIComponent(scheduleTo)}`,
    );
    expect(response.status).toBe(400);
  });
});
