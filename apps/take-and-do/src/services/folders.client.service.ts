import { guestStoreHelper } from "@/stores/guest";
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
    const result = await this.post<Folder & { guest?: boolean }>({
      body: params,
    });
    if (!this.isResultOk(result)) return null;
    const { guest, ...rest } = result.data;
    const folder = rest as Folder;
    if (guest) guestStoreHelper.upsertFolder(folder);
    return folder;
  }

  async update({
    id,
    updates,
  }: {
    id: string;
    updates: FolderUpdate;
  }): Promise<Folder | null> {
    const result = await this.patch<Folder & { guest?: boolean }>({
      pathParams: [id],
      body: updates,
    });
    if (!this.isResultOk(result)) return null;
    const payload = result.data;
    const { guest, ...rest } = payload as Folder & { guest?: boolean };
    const folder = rest as Folder;
    if (guest) guestStoreHelper.upsertFolder(folder);
    return folder;
  }

  async deleteFolder(id: string): Promise<void> {
    const result = await this.delete<{ guest?: boolean; deleted?: boolean }>({
      pathParams: [id],
    });
    if (this.isResultOk(result) && result.data?.guest)
      guestStoreHelper.deleteFolder(id);
  }
}

interface FolderUpdate {
  name?: string;
  emoji?: string | null;
  isPublic?: boolean;
  createdAt?: Date | string;
}
