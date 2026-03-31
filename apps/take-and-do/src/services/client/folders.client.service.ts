import { guestStoreHelper } from "@/stores/guest";
import { Folder } from "@/types/workspace";
import { BaseClientService } from "./base.client.service";

export class FoldersClientService extends BaseClientService {
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

  async create({
    name,
    emoji,
  }: {
    name: string;
    emoji?: string | null;
  }): Promise<Folder> {
    const response = await this.post<Folder & { guest?: boolean }>({
      body: { name, ...(emoji !== undefined ? { emoji } : {}) },
    });
    const { guest, ...rest } = response.data as Folder & { guest?: boolean };
    const normalized = normalizeFolder(rest as Folder);
    if (guest) guestStoreHelper.upsertFolder(normalized);
    return normalized;
  }

  async update({
    id,
    updates,
  }: {
    id: string;
    updates: FolderUpdate;
  }): Promise<Folder> {
    const response = await this.patch<Folder & { guest?: boolean }>({
      pathParams: [id],
      body: updates,
    });
    const { guest, ...rest } = response.data as Folder & { guest?: boolean };
    const normalized = normalizeFolder(rest as Folder);
    if (guest) guestStoreHelper.upsertFolder(normalized);
    return normalized;
  }

  async deleteFolder(id: string): Promise<void> {
    const response = await this.delete<{ guest?: boolean; deleted?: boolean }>({
      pathParams: [id],
    });
    const data = response.data as { guest?: boolean } | undefined;
    if (data?.guest) guestStoreHelper.deleteFolder(id);
  }
}

function normalizeFolder(folder: Folder): Folder {
  return {
    ...folder,
    createdAt: new Date(folder.createdAt),
    updatedAt: new Date(folder.updatedAt),
  };
}

interface FolderUpdate {
  name?: string;
  emoji?: string | null;
  isPublic?: boolean;
  createdAt?: Date | string;
}
