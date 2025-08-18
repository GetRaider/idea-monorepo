import { Logger } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app.module';

import { HttpExceptionFilter } from '@denzel/api/helpers/httpExceptionFilter.helper';
import { configHelper } from '@helpers/config.helper';

// Express request handler signature
type RequestHandler = (req: any, res: any) => void;

let server: RequestHandler | undefined;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  await app.init();
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
  return app.getHttpAdapter().getInstance();
}

// Always export a handler for Vercel
export default async function handler(req: any, res: any) {
  if (!server) {
    const expressApp = await bootstrap();
    server = expressApp as RequestHandler;
  }
  return server!(req, res);
}

// Local development: start HTTP server only outside Vercel
if (process.env.VERCEL !== '1') {
  bootstrap().then((app) => {
    const port = configHelper.getServerPort();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}
