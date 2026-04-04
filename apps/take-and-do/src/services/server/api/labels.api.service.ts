import type { DataAccess } from "@/db/repositories/base.repository";
import type { LabelsRepository } from "@/db/repositories/labels.repository";

import { BaseApiService } from "@/services/server/api/base.api.service";

export class LabelsApiService extends BaseApiService {
  constructor(private readonly repository: LabelsRepository) {
    super();
  }

  async getAll(access: DataAccess) {
    return this.repository.getAllLabels(access);
  }

  async add(access: DataAccess, label: string) {
    return this.repository.addLabel(access, label);
  }

  async rename(access: DataAccess, oldName: string, newName: string) {
    return this.handleOperation(() =>
      this.repository.renameLabel(access, oldName, newName),
    );
  }

  async delete(access: DataAccess, name: string) {
    return this.repository.deleteLabelByName(access, name);
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Label not found") this.notFound("Label");
    if (message === "Label name is required") this.badRequest(message);
    if (message === "A label with that name already exists")
      this.conflict(message);
    throw error;
  }
}
