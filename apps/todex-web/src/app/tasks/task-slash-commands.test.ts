import { describe, expect, it } from "vitest";

import {
  filterSlashCommands,
  matchSlashQuery,
  SLASH_COMMANDS,
} from "./task-slash-commands";

describe("task slash commands", () => {
  it("returns every command when the query is empty", () => {
    expect(filterSlashCommands("")).toEqual(SLASH_COMMANDS);
  });

  it("filters by title and aliases", () => {
    expect(filterSlashCommands("h1").map((item) => item.title)).toEqual([
      "Heading 1",
    ]);
    expect(filterSlashCommands("todo").map((item) => item.title)).toEqual([
      "Checklist",
    ]);
  });

  it("matches a leading slash query on the current line", () => {
    expect(matchSlashQuery("/")).toBe("");
    expect(matchSlashQuery("/hea")).toBe("hea");
    expect(matchSlashQuery("hello /list")).toBeNull();
  });
});
