import type { DataAccess } from "@/db/data-access";
import type { FoldersRepository } from "@/db/repositories/folders.repository";

export class FoldersApiService {
  constructor(private readonly repository: FoldersRepository) {}

  async getAll(access: DataAccess) {
    return this.repository.getAllFolders(access);
  }

  async getById(id: string, access: DataAccess) {
    return this.repository.getFolderById(id, access);
  }

  async create(name: string, access: DataAccess, emoji?: string | null) {
    return this.repository.createFolder(name, access, emoji);
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
    return this.repository.updateFolder(id, data, access);
  }

  async delete(id: string, access: DataAccess) {
    return this.repository.deleteFolder(id, access);
  }
}
