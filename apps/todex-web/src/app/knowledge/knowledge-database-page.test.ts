import { describe, expect, it } from "vitest";
import {
  KnowledgeDatabasePageSchema,
  UpdateKnowledgeDatabasePageSchema,
} from "@repo/api/todex";

describe("Knowledge database record pages", () => {
  it("accepts a database record page with independent rich content", () => {
    const page = {
      databaseId: "db1",
      spaceId: "space1",
      row: {
        id: "row1",
        databaseId: "db1",
        cells: { title1: "Project" },
        position: 0,
        updatedAt: "2026-11-20T10:00:00.000Z",
      },
      properties: [
        {
          id: "title1", databaseId: "db1",
          name: "Name", type: "title", options: [], position: 0,
        },
      ],
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Detailed notes" }] }],
      },
      icon: "📄",
      cover: null,
      version: 3,
    };
    expect(KnowledgeDatabasePageSchema.parse(page).version).toBe(3);
  });

  it("requires expected version and a valid page change", () => {
    const content = {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
    expect(UpdateKnowledgeDatabasePageSchema.safeParse({
      expectedVersion: 2, content,
    }).success).toBe(true);
    expect(UpdateKnowledgeDatabasePageSchema.safeParse({
      content,
    }).success).toBe(false);
    expect(UpdateKnowledgeDatabasePageSchema.safeParse({
      expectedVersion: 2,
    }).success).toBe(false);
    expect(UpdateKnowledgeDatabasePageSchema.safeParse({
      expectedVersion: 2,
      cover: "javascript:alert(1)",
    }).success).toBe(false);
  });
});
