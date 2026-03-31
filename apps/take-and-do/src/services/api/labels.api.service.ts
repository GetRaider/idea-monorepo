import type { LabelsRepository } from "@/db/repositories/labels.repository";

export class LabelsApiService {
  constructor(private readonly repository: LabelsRepository) {}

  async getAll() {
    return this.repository.getAllLabels();
  }

  async add(label: string) {
    return this.repository.addLabel(label);
  }

  async rename(oldName: string, newName: string) {
    return this.repository.renameLabel(oldName, newName);
  }

  async delete(name: string) {
    return this.repository.deleteLabelByName(name);
  }
}
