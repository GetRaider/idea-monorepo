import { Global, Module } from "@nestjs/common";

import { ContentIndexQueue } from "./content-index.queue";

@Global()
@Module({
  providers: [ContentIndexQueue],
  exports: [ContentIndexQueue],
})
export class ContentIndexModule {}
