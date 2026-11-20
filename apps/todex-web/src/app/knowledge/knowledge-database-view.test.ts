import { describe, expect, it } from "vitest";
import type { KnowledgeDatabase } from "@repo/api/todex";
import { visibleKnowledgeRows } from "./knowledge-database-view";

const fixture: KnowledgeDatabase = {
  id: "db-1", workspaceId: "ws-1", spaceId: "space-1", name: "Research",
  properties: [
    { id: "name", databaseId: "db-1", name: "Name", type: "title", options: [], position: 0 },
    { id: "score", databaseId: "db-1", name: "Score", type: "number", options: [], position: 1 },
    { id: "status", databaseId: "db-1", name: "Status", type: "select", options: ["Todo", "Done"], position: 2 },
  ],
  rows: [
    { id: "a", databaseId: "db-1", cells: { name: "Alpha", score: 2, status: "Todo" }, position: 0, updatedAt: "2026-11-20T00:00:00.000Z" },
    { id: "b", databaseId: "db-1", cells: { name: "Beta", score: 10, status: "Done" }, position: 1, updatedAt: "2026-11-20T00:00:00.000Z" },
    { id: "c", databaseId: "db-1", cells: { name: "Gamma", score: null, status: "Todo" }, position: 2, updatedAt: "2026-11-20T00:00:00.000Z" },
  ],
  view: { id: "view-1", databaseId: "db-1", name: "Table", kind: "table", sorts: [], filters: [] },
};

describe("Knowledge database table view", () => {
  it("preserves manual row order when no sort or filter exists", () => {
    expect(visibleKnowledgeRows(fixture).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
  it("sorts numeric properties numerically", () => {
    expect(visibleKnowledgeRows({
      ...fixture, view: { ...fixture.view, sorts: [{ propertyId: "score", direction: "asc" }] },
    }).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
  it("sorts numeric descending and filters typed values", () => {
    expect(visibleKnowledgeRows({
      ...fixture,
      view: { ...fixture.view,
        sorts: [{ propertyId: "score", direction: "desc" }],
        filters: [{ propertyId: "status", operator: "equals", value: "Todo" }],
      },
    }).map((r) => r.id)).toEqual(["a", "c"]);
  });
  it("supports contains and empty filters", () => {
    expect(visibleKnowledgeRows({
      ...fixture, view: { ...fixture.view, filters: [{ propertyId: "name", operator: "contains", value: "amm" }] },
    }).map((r) => r.id)).toEqual(["c"]);
    expect(visibleKnowledgeRows({
      ...fixture, view: { ...fixture.view, filters: [{ propertyId: "score", operator: "is_empty" }] },
    }).map((r) => r.id)).toEqual(["c"]);
  });
});
