import { processEnv } from './processEnv.helper';

class ConfigHelper {
  private readonly defaultPort = '8090';

  getServerPort(): string {
    return processEnv?.PORT ?? this.defaultPort;
  }
}

export const configHelper = new ConfigHelper();
