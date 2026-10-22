import { describe, expect, it, vi } from "vitest";

import { ToolExecutionLayer } from "./tool-execution-layer";
import { ToolRegistry } from "./tool-registry";
import { DocToolHandler } from "./doc-tool-handler";

describe("DocToolHandler", () => {
  it("files a doc in the docs folder with that name", async () => {
    const docs = {
      create: vi.fn(async () => ({ id: "doc-1" })),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(async () => ({ id: "doc-1" })),
      remove: vi.fn(),
    };
    const folders = {
      list: vi.fn(async () => [{ id: "folder-magnus", name: "Magnus" }]),
    };
    const registry = new ToolRegistry();
    registry.register(new DocToolHandler(docs as never, folders as never).handlers());
    const runs = {
      findToolExecution: vi.fn(async () => null),
      insertToolExecution: vi.fn(),
    };
    const layer = new ToolExecutionLayer(registry, runs as never);

    const created = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-create-folder",
      name: "create_doc",
      args: { type: "common", title: "Doc #1", folderId: "Magnus" },
    });

    expect(created.ok).toBe(true);
    expect(folders.list).toHaveBeenCalledWith("workspace-1", "docs");
    expect(docs.create).toHaveBeenCalledWith(
      "workspace-1",
      expect.objectContaining({ title: "Doc #1", folderId: "folder-magnus" }),
    );

    const moved = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-move",
      name: "update_doc",
      args: { docId: "doc-1", folderName: "Magnus" },
    });

    expect(moved.ok).toBe(true);
    expect(docs.update).toHaveBeenCalledWith("workspace-1", "doc-1", {
      folderId: "folder-magnus",
    });
  });

  it("does not create a doc when no docs folder has that name", async () => {
    const docs = {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const folders = { list: vi.fn(async () => []) };
    const registry = new ToolRegistry();
    registry.register(new DocToolHandler(docs as never, folders as never).handlers());
    const runs = {
      findToolExecution: vi.fn(async () => null),
      insertToolExecution: vi.fn(),
    };
    const layer = new ToolExecutionLayer(registry, runs as never);

    const created = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-missing-folder",
      name: "create_doc",
      args: { type: "common", title: "Doc #1", folderName: "Magnus" },
    });

    expect(created).toEqual({
      ok: false,
      error: 'No docs folder named "Magnus". Docs folders: (none)',
    });
    expect(docs.create).not.toHaveBeenCalled();
  });

  it("rejects a model-supplied workspace id and creates in the conversation workspace", async () => {
    const docs = {
      create: vi.fn(async () => ({ id: "doc-1" })),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const layer = layerFor(docs);

    const rejected = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-reject",
      name: "create_doc",
      args: { workspaceId: "other", type: "common", title: "Nope" },
    });

    expect(rejected).toEqual({ ok: false, error: "workspaceId is not allowed" });
    expect(docs.create).not.toHaveBeenCalled();

    const created = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-create",
      name: "create_doc",
      args: { type: "common", title: "Agent smoke test", content: "Hello" },
    });

    expect(created.ok).toBe(true);
    expect(docs.create).toHaveBeenCalledWith("workspace-1", {
      type: "common",
      title: "Agent smoke test",
      body: {
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
        },
      },
    });
  });

  it("writes goal content into why", async () => {
    const docs = {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(async () => ({ type: "goal" })),
      update: vi.fn(async () => ({ id: "doc-1" })),
      remove: vi.fn(),
    };
    const layer = layerFor(docs);

    const updated = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-update",
      name: "update_doc",
      args: { docId: "doc-1", content: "Ship the agent" },
    });

    expect(updated.ok).toBe(true);
    expect(docs.get).toHaveBeenCalledWith("workspace-1", "doc-1");
    expect(docs.update).toHaveBeenCalledWith("workspace-1", "doc-1", {
      body: {
        why: {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Ship the agent" }] },
          ],
        },
      },
    });
  });
});

function layerFor(docs: {
  create: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}) {
  const registry = new ToolRegistry();
  registry.register(
    new DocToolHandler(docs as never, { list: vi.fn(async () => []) } as never).handlers(),
  );
  const runs = {
    findToolExecution: vi.fn(async () => null),
    insertToolExecution: vi.fn(),
  };
  return new ToolExecutionLayer(registry, runs as never);
}
