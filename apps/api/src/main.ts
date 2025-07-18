import { NestFactory } from '@nestjs/core';

import { AppModule } from '@modules/app.module';
import { links } from '@denzel/api/src';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log({ asd: links.dto.CreateLinkDto });
}
bootstrap();
