import { Folder } from "@/types/workspace";

import { BaseClientService } from "./base.client.service";
import { Route } from "@/constants/route.constant";

export class FoldersClientService extends BaseClientService {
  constructor() {
    super(Route.FOLDERS);
  }

  async getAll(): Promise<Folder[]> {
    const result = await this.get<Folder[]>({});
    if (!this.isResultOk(result)) return [];
    return result.data;
  }

  async getById(id: string): Promise<Folder | null> {
    const result = await this.get<Folder>({ pathParams: [id] });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async create(params: {
    name: string;
    emoji?: string | null;
  }): Promise<Folder | null> {
    const result = await this.post<Folder>({
      body: params,
    });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async update({
    id,
    updates,
  }: {
    id: string;
    updates: FolderUpdate;
  }): Promise<Folder | null> {
    const result = await this.patch<Folder>({
      pathParams: [id],
      body: updates,
    });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async deleteFolder(id: string): Promise<void> {
    await this.delete<void>({ pathParams: [id] });
  }
}

interface FolderUpdate {
  name?: string;
  emoji?: string | null;
  isPublic?: boolean;
  createdAt?: Date | string;
}
