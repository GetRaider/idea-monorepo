// Environment variables are loaded by Nest's ConfigModule (see AppModule)

interface IProcessEnvHelper {
  PORT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_TOKEN: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  DB_URL: string;
  WEB_ORIGIN: string;
}

export const processEnv = process.env as unknown as IProcessEnvHelper;
