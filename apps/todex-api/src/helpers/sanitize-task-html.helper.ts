import sanitizeHtml from "sanitize-html";

export function sanitizeTaskHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...TASK_HTML_TAGS],
    allowedAttributes: TASK_HTML_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}

const TASK_HTML_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "strike",
  "u",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "a",
  "span",
  "div",
] as const;

const TASK_HTML_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  ul: ["data-type"],
  ol: ["data-type"],
  li: ["data-type", "data-checked"],
  code: ["class"],
};
