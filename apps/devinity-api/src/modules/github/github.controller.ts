import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  ParseIntPipe,
} from "@nestjs/common";
import { GitHubService } from "./github.service";
import {
  GitHubUserResponseDto,
  GitHubUserStatsResponseDto,
  GitHubRepositoriesResponseDto,
} from "./dto/github-user.dto";

@Controller("github")
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(private readonly githubService: GitHubService) {}

  @Get("user/:username")
  async getUserProfile(
    @Param("username") username: string,
  ): Promise<GitHubUserResponseDto> {
    this.logger.log(`Fetching GitHub profile for ${username}`);
    const user = await this.githubService.getUserProfile(username);
    return { user };
  }

  @Get("user/:username/stats")
  async getUserStats(
    @Param("username") username: string,
  ): Promise<GitHubUserStatsResponseDto> {
    this.logger.log(`Fetching GitHub stats for ${username}`);
    const contributions =
      await this.githubService.getUserContributionStats(username);
    return { contributions };
  }

  @Get("user/:username/repositories")
  async getUserRepositories(
    @Param("username") username: string,
    @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
    @Query("perPage", new ParseIntPipe({ optional: true }))
    perPage: number = 30,
  ): Promise<GitHubRepositoriesResponseDto> {
    this.logger.log(`Fetching GitHub repositories for ${username}`);
    const { repositories, totalCount } =
      await this.githubService.getUserRepositories(username, page, perPage);
    return { repositories, totalCount };
  }
}

