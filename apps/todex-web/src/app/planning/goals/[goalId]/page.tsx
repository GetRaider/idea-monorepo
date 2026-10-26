"use client";

import { use } from "react";

import { GoalEditor } from "../goal-editor";

export default function GoalPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = use(params);
  return <GoalEditor goalId={goalId} />;
}
