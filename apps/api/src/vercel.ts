import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { HttpExceptionFilter } from '@denzel/api/helpers/httpExceptionFilter.helper';

import type { IncomingMessage, ServerResponse } from 'http';

let cachedHandler:
  | ((req: IncomingMessage, res: ServerResponse) => Promise<void> | void)
  | null = null;

async function createServerlessHandler() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Credentials',
    ],
    exposedHeaders: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Credentials',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  const expressInstance = app.getHttpAdapter().getInstance();
  return (req: IncomingMessage, res: ServerResponse) =>
    expressInstance(req, res);
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!cachedHandler) {
    cachedHandler = await createServerlessHandler();
  }

  return cachedHandler(req, res);
}
