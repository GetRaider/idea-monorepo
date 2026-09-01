import { NestFactory } from "@nestjs/core";
import { RequestMethod } from "@nestjs/common";

import { AppModule } from "./modules/app.module";
import { env } from "./env/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: env.web.baseUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("v1", {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "api/auth/{*path}", method: RequestMethod.ALL },
    ],
  });

  const port = Number(env.port);
  await app.listen(port);
}

void bootstrap();
