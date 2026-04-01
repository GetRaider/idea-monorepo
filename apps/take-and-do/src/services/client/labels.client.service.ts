import { BaseClientService } from "./base.client.service";

export class LabelsClientService extends BaseClientService {
  constructor() {
    super("/labels");
  }

  async getAll(): Promise<string[]> {
    const result = await this.get<string[]>({});
    return this.isResultOk(result) ? result.data : [];
  }

  async create(label: string): Promise<string | null> {
    const result = await this.post<{ label: string }>({ body: { label } });
    if (!this.isResultOk(result)) return null;
    return result.data.label ?? null;
  }

  async rename(params: {
    oldName: string;
    newName: string;
  }): Promise<string | null> {
    const result = await this.patch<{ label: string }>({ body: params });
    if (!this.isResultOk(result)) return null;
    return result.data.label;
  }

  async remove(name: string): Promise<void> {
    await this.delete<{ ok: boolean }>({ body: { name } });
  }
}
