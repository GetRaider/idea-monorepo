import { MongooseModule } from '@nestjs/mongoose';

import { processEnv } from './processEnv.helper';
import { DynamicModule } from '@nestjs/common';

const {
  DB_BASE_URL,
  DB_CLUSTER_URL,
  DB_LOGIN,
  DB_PASSWORD,
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  MONGODB_HOST_URL,
  IS_LOCAL,
} = processEnv;

const encodedUsername = encodeURIComponent(DB_LOGIN);
const encodedPassword = encodeURIComponent(DB_PASSWORD);

class ConfigHelper {
  private readonly defaultPort = '8090';

  getServerPort(): string {
    return processEnv.PORT ?? this.defaultPort;
  }

  getMongooseModule(): DynamicModule {
    return IS_LOCAL === 'true'
      ? MongooseModule.forRoot(`mongodb://${MONGODB_HOST_URL}:27017/`, {
          dbName: 'locale',
          auth: {
            username: MONGODB_USERNAME,
            password: MONGODB_PASSWORD,
          },
        })
      : MongooseModule.forRoot(
          `${DB_BASE_URL}${encodedUsername}:${encodedPassword}${DB_CLUSTER_URL}`,
        );
  }
}

export const configHelper = new ConfigHelper();
