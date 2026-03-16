import { Folder } from "@/types/workspace";

import { BaseApiService } from "./base-api.service";

export class FoldersApiService extends BaseApiService {
  constructor() {
    super("/folders");
  }

  async getAll(): Promise<Folder[]> {
    const response = await this.get<Folder[]>();
    return response.data.map(normalizeFolder);
  }

  async getById(id: string): Promise<Folder> {
    const response = await this.get<Folder>({ pathParams: [id] });
    return normalizeFolder(response.data);
  }

  async create(name: string): Promise<Folder> {
    const response = await this.post<Folder>({ body: { name } });
    return normalizeFolder(response.data);
  }

  async update(id: string, name: string): Promise<Folder> {
    const response = await this.patch<Folder>({
      pathParams: [id],
      body: { name },
    });
    return normalizeFolder(response.data);
  }

  async deleteFolder(id: string): Promise<void> {
    await this.delete({ pathParams: [id] });
  }
}

function normalizeFolder(folder: Folder): Folder {
  return {
    ...folder,
    createdAt: new Date(folder.createdAt),
    updatedAt: new Date(folder.updatedAt),
  };
}
