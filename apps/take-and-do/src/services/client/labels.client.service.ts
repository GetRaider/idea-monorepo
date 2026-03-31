import { BaseClientService } from "./base.client.service";

export class LabelsClientService extends BaseClientService {
  constructor() {
    super("/labels");
  }

  async getAll(): Promise<string[]> {
    const response = await this.get<string[]>();
    return response.data;
  }

  async create(label: string): Promise<string> {
    const response = await this.post<{ label: string }>({ body: { label } });
    return response.data.label;
  }

  async rename({
    oldName,
    newName,
  }: {
    oldName: string;
    newName: string;
  }): Promise<string> {
    const response = await this.patch<{ label: string }>({
      body: { oldName, newName },
    });
    return response.data.label;
  }

  async remove(name: string): Promise<void> {
    await this.delete<{ ok: boolean }>({ body: { name } });
  }
}
