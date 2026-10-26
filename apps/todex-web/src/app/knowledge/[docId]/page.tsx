"use client";

import { use } from "react";

import { DocEditor } from "../doc-editor";

export default function DocPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  return <DocEditor docId={docId} />;
}
