import { NestFactory } from "@nestjs/core";

import { AppModule } from "./modules/app.module";
import { configHelper } from "./helpers/config.helper";
import { HttpExceptionFilter } from "@repo/api/helpers/httpExceptionFilter.helper";
import { env } from "./env/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Better Auth requires
    bodyParser: false,
  });
  // CORS configuration for cross-origin cookie authentication
  app.enableCors({
    origin: env.web.baseUrl, // Explicitly allow frontend origin (required with credentials)
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Credentials",
    ],
    exposedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Credentials",
    ],
    // preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  const port = configHelper.getServerPort();

  app.listen(port, () => {
    console.log(`Server is running on 'http://localhost:${port}'`);
  });
}

bootstrap();
