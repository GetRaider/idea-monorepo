import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { CalendarToolHandler } from "./calendar-tool-handler";
import { ToolExecutionLayer } from "./tool-execution-layer";
import { ToolRegistry } from "./tool-registry";

describe("CalendarToolHandler", () => {
  it("rejects a model-supplied workspace id and creates in the conversation workspace", async () => {
    const events = {
      create: vi.fn(async () => ({ id: "event-1" })),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const layer = layerFor(events);

    const rejected = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-reject",
      name: "create_calendar_event",
      args: {
        workspaceId: "other",
        title: "Nope",
        start: "2026-10-23T10:00:00.000Z",
        end: "2026-10-23T11:00:00.000Z",
        timeZone: "Europe/Warsaw",
      },
    });

    expect(rejected).toEqual({ ok: false, error: "workspaceId is not allowed" });
    expect(events.create).not.toHaveBeenCalled();

    const created = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-create",
      name: "create_calendar_event",
      args: {
        title: "Agent smoke test",
        start: "2026-10-23T10:00:00.000Z",
        end: "2026-10-23T11:00:00.000Z",
        timeZone: "Europe/Warsaw",
      },
    });

    expect(created.ok).toBe(true);
    expect(events.create).toHaveBeenCalledWith("workspace-1", "user-1", {
      title: "Agent smoke test",
      start: "2026-10-23T10:00:00.000Z",
      end: "2026-10-23T11:00:00.000Z",
      timeZone: "Europe/Warsaw",
    });
  });

  it("returns a tool error when the event is missing", async () => {
    const events = {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(async () => {
        throw new NotFoundException("Calendar event");
      }),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const layer = layerFor(events);

    const missing = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-missing",
      name: "get_calendar_event",
      args: { eventId: "missing" },
    });

    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.error).toContain("Calendar event");
  });
});

function layerFor(events: {
  create: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}) {
  const registry = new ToolRegistry();
  registry.register(new CalendarToolHandler(events as never).handlers());
  const runs = {
    findToolExecution: vi.fn(async () => null),
    insertToolExecution: vi.fn(),
  };
  return new ToolExecutionLayer(registry, runs as never);
}
