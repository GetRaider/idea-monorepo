import type { ProgressStageInput } from "@repo/api/todex";

export function planProgressStageReplace(
  existingIds: readonly string[],
  stages: readonly ProgressStageInput[],
): ProgressStagePlan {
  const existing = new Set(existingIds);
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const updates: PlannedProgressStage[] = [];
  const inserts: PlannedProgressStage[] = [];

  for (let position = 0; position < stages.length; position += 1) {
    const stage = stages[position];
    if (!stage) continue;
    const nameKey = stage.name.toLowerCase();
    if (seenNames.has(nameKey)) {
      throw new ProgressStagePlanError("Duplicate progress stage name");
    }
    seenNames.add(nameKey);
    if (stage.id) {
      if (seenIds.has(stage.id)) {
        throw new ProgressStagePlanError("Duplicate progress stage id");
      }
      if (!existing.has(stage.id)) {
        throw new ProgressStagePlanError("Unknown progress stage");
      }
      seenIds.add(stage.id);
      updates.push({ id: stage.id, name: stage.name, position });
      continue;
    }
    inserts.push({ name: stage.name, position });
  }

  return {
    updates,
    inserts,
    removeIds: existingIds.filter((id) => !seenIds.has(id)),
  };
}

export class ProgressStagePlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProgressStagePlanError";
  }
}

interface PlannedProgressStage {
  id?: string;
  name: string;
  position: number;
}

interface ProgressStagePlan {
  updates: PlannedProgressStage[];
  inserts: PlannedProgressStage[];
  removeIds: string[];
}
