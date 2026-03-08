import { BaseApiService } from "./base-api.service";

export class AnalyticsApiService extends BaseApiService {
  constructor() {
    super("/analytics");
  }

  async get(): Promise<Folder[]> {
    const response = await this.get<Folder[]>();
    return response.data.map(normalizeFolder);
  }
}
