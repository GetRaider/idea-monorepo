import { register } from 'tsconfig-paths';
import { loadConfig } from 'tsconfig-paths';

const configResult = loadConfig(__dirname + '/../tsconfig.json');

if (configResult.resultType === 'success') {
  register({
    baseUrl: configResult.baseUrl,
    paths: configResult.paths,
  });
}

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@modules/app.module';
import { HttpExceptionFilter } from '@denzel/api/helpers/httpExceptionFilter.helper';
import { configHelper } from '@helpers/config.helper';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Better Auth requires
    bodyParser: false,
  });
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
  const port = configHelper.getServerPort();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

bootstrap();
