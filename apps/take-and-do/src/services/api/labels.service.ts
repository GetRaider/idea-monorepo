import { BaseApiService } from "./base-api.service";

export class LabelsService extends BaseApiService {
  constructor() {
    super("/labels");
  }

  async getAll(): Promise<string[]> {
    const response = await this.get<string[]>();
    return response.data;
  }

  async create(label: string): Promise<string> {
    const response = await this.post<{ label: string }>({
      body: { label },
    });
    return response.data.label;
  }
}
