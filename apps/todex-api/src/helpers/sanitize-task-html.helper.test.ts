import { describe, expect, it } from "vitest";

import { sanitizeTaskHtml } from "./sanitize-task-html.helper";

describe("sanitizeTaskHtml", () => {
  it("strips script tags and keeps safe markup", () => {
    expect(
      sanitizeTaskHtml("<p>ok</p><script>alert(1)</script>"),
    ).toBe("<p>ok</p>");
  });

  it("strips iframe, img, and event handlers", () => {
    const sanitized = sanitizeTaskHtml(
      '<p onclick="alert(1)">x</p><iframe src="https://evil.example"></iframe><img src=x onerror=alert(1)>',
    );
    expect(sanitized).toBe("<p>x</p>");
    expect(sanitized).not.toMatch(/iframe|img|onerror|onclick/i);
  });

  it("strips javascript urls", () => {
    const sanitized = sanitizeTaskHtml(
      '<a href="javascript:alert(1)">x</a>',
    );
    expect(sanitized).not.toMatch(/javascript:/i);
  });

  it("keeps mention chips", () => {
    const html =
      '<p>See <span data-target-type="task" data-target-id="task-1" data-label="TDX-4 Ship">@TDX-4 Ship</span></p>';
    expect(sanitizeTaskHtml(html)).toBe(html);
  });

  it("keeps mention links", () => {
    const html =
      '<p>See <a href="/docs/doc-1" data-target-type="doc" data-target-id="doc-1" data-label="Launch">@Launch</a></p>';
    expect(sanitizeTaskHtml(html)).toBe(html);
  });

  it("keeps TipTap list and checklist markup", () => {
    const html =
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>done</p></li></ul>';
    expect(sanitizeTaskHtml(html)).toBe(html);
  });
});
