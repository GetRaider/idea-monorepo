import { Folder } from "@/types/workspace";

import { BaseApiService } from "./base-api.service";

export class FoldersService extends BaseApiService {
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
}

function normalizeFolder(folder: Folder): Folder {
  return {
    ...folder,
    createdAt: new Date(folder.createdAt),
    updatedAt: new Date(folder.updatedAt),
  };
}
