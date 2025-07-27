import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from '@modules/app.module';
import { HttpExceptionFilter } from '@denzel/api/src/helpers/httpExceptionFilter.helper';
import { configHelper } from '@helpers/config.helper';

void (async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const port = configHelper.getServerPort();

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
    await app.listen(port, () =>
      console.info(`Server has started on 'http://localhost:${port}'`),
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'unknown reason';
    console.error(`Server has not started because of: ${errorMessage}`);
  }
})();
