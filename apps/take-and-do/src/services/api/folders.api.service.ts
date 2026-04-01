import type { DataAccess } from "@/db/repositories/base.repository";
import type { FoldersRepository } from "@/db/repositories/folders.repository";
import { BaseApiService } from "@/services/api/base.api.service";

export class FoldersApiService extends BaseApiService {
  constructor(private readonly repository: FoldersRepository) {
    super();
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(() => this.repository.getAllFolders(access));
  }

  async getById(id: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.getFolderById(id, access),
    );
  }

  async create(name: string, access: DataAccess, emoji?: string | null) {
    return this.handleOperation(() =>
      this.repository.createFolder(name, access, emoji),
    );
  }

  async update(
    id: string,
    data: {
      name?: string;
      emoji?: string | null;
      isPublic?: boolean;
      createdAt?: Date | string;
    },
    access: DataAccess,
  ) {
    return this.handleOperation(() =>
      this.repository.updateFolder(id, data, access),
    );
  }

  async delete(id: string, access: DataAccess) {
    return this.handleOperation(() => this.repository.deleteFolder(id, access));
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Folder not found") this.notFound("Folder");
    if (message === "Folder name is required") this.badRequest(message);
    throw error;
  }
}
