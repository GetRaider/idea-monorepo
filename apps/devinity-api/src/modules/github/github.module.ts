import { Module, Logger } from "@nestjs/common";
import { GitHubController } from "./github.controller";
import { GitHubService } from "./github.service";
import { CacheModule } from "../../db/cache.module";

@Module({
  imports: [CacheModule],
  controllers: [GitHubController],
  providers: [GitHubService, Logger],
  exports: [GitHubService],
})
export class GitHubModule {}

