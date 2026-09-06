import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import type { Server } from "node:http";
import { beforeEach, describe, expect, it } from "vitest";
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

  it("rejects unauthenticated list", async () => {
    const response = await request(app.getHttpServer() as Server).get(
      "/tasks?boardId=board-1",
    );
    expect(response.status).toBeGreaterThanOrEqual(403);
  });
});
