import { describe, expect, it, vi } from "vitest";

import { ChunkIngestor } from "./chunk-ingestor";

describe("ChunkIngestor", () => {
  it("stores chunks from the doc service and drops a deleted source", async () => {
    const replace = vi.fn();
    const remove = vi.fn();
    const embedding = [0.1, 0.2];
    const ingestor = new ChunkIngestor(
      {
        readIndexText: vi.fn(async () => ({
          title: "Doc #1",
          text: "Hello from Magnus",
        })),
      } as never,
      { readIndexText: vi.fn() } as never,
      { replace, remove } as never,
      { embed: vi.fn(async () => [embedding]) } as never,
    );

    await ingestor.ingest({
      workspaceId: "workspace-1",
      sourceType: "doc",
      sourceId: "doc-1",
    });

    expect(replace).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      sourceType: "doc",
      sourceId: "doc-1",
      title: "Doc #1",
      chunks: [{ content: "Hello from Magnus", embedding }],
    });

    await ingestor.ingest({
      workspaceId: "workspace-1",
      sourceType: "doc",
      sourceId: "doc-1",
      removed: true,
    });

    expect(remove).toHaveBeenCalledWith("workspace-1", "doc", "doc-1");
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
