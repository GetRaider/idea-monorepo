import { Module } from "@nestjs/common";
import { KnowledgeDatabasesController } from "./knowledge-databases.controller";
import { KnowledgeDatabasesService } from "./knowledge-databases.service";

@Module({
  controllers: [KnowledgeDatabasesController],
  providers: [KnowledgeDatabasesService],
})
export class KnowledgeDatabasesModule {}
