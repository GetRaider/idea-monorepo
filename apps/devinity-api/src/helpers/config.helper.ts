import { env } from "src/env/env";

class ConfigHelper {
  private readonly defaultPort = "8090";

  getServerPort(): string {
    return env.port ?? this.defaultPort;
  }
}

export const configHelper = new ConfigHelper();
