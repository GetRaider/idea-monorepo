import { BaseApiService } from "@/services/server/api/base.api.service";

import type { LabelsRepository } from "@/db/repositories/labels.repository";

export class LabelsApiService extends BaseApiService {
  constructor(private readonly repository: LabelsRepository) {
    super();
  }

  async getAll() {
    return this.repository.getAllLabels();
  }

  async add(label: string) {
    return this.repository.addLabel(label);
  }

  async rename(oldName: string, newName: string) {
    return this.handleOperation(() =>
      this.repository.renameLabel(oldName, newName),
    );
  }

  async delete(name: string) {
    return this.repository.deleteLabelByName(name);
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Label not found") this.notFound("Label");
    if (message === "Label name is required") this.badRequest(message);
    if (message === "Label name is already taken") this.conflict(message);
    throw error;
  }
}
