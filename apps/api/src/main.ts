import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

import { AppModule } from '@modules/app.module';
import { HttpExceptionFilter } from '@denzel/api/helpers/httpExceptionFilter.helper';
import { configHelper } from '@helpers/config.helper';

// Single code path that supports both local dev (listen) and Vercel (handler)
const server = express();
let initialized = false;
let appInstance: any;

async function bootstrap() {
  if (!initialized) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        bodyParser: false, // Required for Better Auth [https://www.better-auth.com/docs/integrations/nestjs]
      },
    );

    // Body parsing is handled by @thallesp/nestjs-better-auth when bodyParser is false

    // TODO: Handle CORS properly
    app.enableCors({
      origin: true, // Allow requests from any origin
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
      credentials: true, // Allow credentials (cookies, authorization headers, etc.)
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.useGlobalFilters(new HttpExceptionFilter(new Logger()));

    await app.init();
    appInstance = app;
    initialized = true;
  }
}

// Local development: start listening if not running on Vercel
if (!process.env.VERCEL) {
  void (async function startLocal() {
    try {
      await bootstrap();
      const port = configHelper.getServerPort();
      await appInstance.listen(port, () =>
        console.info(`Server has started on 'http://localhost:${port}'`),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'unknown reason';
      console.error(`Server has not started because of: ${errorMessage}`);
    }
  })();
}

// Vercel entrypoint: exported handler
export default async function handler(req: any, res: any) {
  await bootstrap();
  return server(req, res);
}
