"use client";

import type { ProseDoc } from "@repo/api/todex";

import { TaskDescriptionEditor } from "../planning/task-description-editor";

export function KnowledgeContentEditor({
  docId,
  spaceId,
  document,
  onChange,
}: {
  docId: string;
  spaceId: string;
  document: ProseDoc;
  onChange: (next: ProseDoc) => void;
}) {
  return (
    <TaskDescriptionEditor
      key={docId}
      content=""
      appearance="plain"
      knowledgeMode
      knowledgeSpaceId={spaceId}
      excludeDocId={docId}
      document={
        (document.content ?? []).length > 0
          ? document
          : { type: "doc", content: [{ type: "paragraph" }] }
      }
      onDocumentChange={onChange}
    />
  );
}
