"use client";

import { ExecutionActivity } from "../execution-activity";
import { ExecutionCanvas } from "../execution-canvas";

export default function ExecutionActivityPage() {
  return (
    <ExecutionCanvas title="Activity">
      <ExecutionActivity />
    </ExecutionCanvas>
  );
}
