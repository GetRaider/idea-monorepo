import { config } from 'dotenv';

config();

interface IProcessEnvHelper {
  IS_LOCAL: string;
  PORT: string;
  DB_BASE_URL: string;
  DB_CLUSTER_URL: string;
  DB_LOGIN: string;
  DB_PASSWORD: string;
  MONGODB_HOST_URL: string;
  MONGODB_USERNAME: string;
  MONGODB_PASSWORD: string;
  SECRET: string;
}

export const processEnv = process.env as unknown as IProcessEnvHelper;
