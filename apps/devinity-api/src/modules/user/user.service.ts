import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { eq } from "drizzle-orm";
import Redis from "ioredis";
import { DRIZZLE_DB } from "../../db/tokens";
import { REDIS_CLIENT } from "../../db/redis.tokens";
import { InsertUser, SelectUser } from "../../db/schema";
import { users } from "../../db/auth-schema";

@Injectable()
export class UserService {
  constructor(
    private readonly log: Logger,
    @Inject(DRIZZLE_DB) private readonly db: any,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(dto: Partial<SelectUser>): Promise<SelectUser> {
    if (!dto || Object.keys(dto).length === 0) {
      throw new HttpException("Request body is empty", HttpStatus.BAD_REQUEST);
    }
    const now = new Date();
    const insert: any = {
      id: dto.id ?? crypto.randomUUID?.() ?? undefined,
      name: dto.name ?? "User",
      email: dto.email ?? `user_${Date.now()}@example.com`,
      emailVerified: dto.emailVerified ?? false,
      image: dto.image ?? null,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    try {
      const [created] = await this.db
        .insert(users)
        .values(insert as InsertUser)
        .returning();

      // Invalidate the users:all cache when a new user is created
      await this.cacheManager.del("users:all");
      this.log.log("🗑️  Invalidated users cache");

      return created;
    } catch (error) {
      this.log.error(error);
      throw new HttpException("Failed to create user", HttpStatus.BAD_REQUEST);
    }
  }

  async getAll(): Promise<SelectUser[]> {
    const cacheKey = "users:all";

    // Try to get from cache first
    const cached = await this.cacheManager.get<SelectUser[]>(cacheKey);
    if (cached) {
      this.log.log("✅ Returning users from cache");
      return cached;
    }

    // If not in cache, fetch from database
    this.log.log("📦 Fetching users from database");
    const allUsers = await this.db.select().from(users);

    // Store in cache for 5 minutes (300000ms)
    await this.cacheManager.set(cacheKey, allUsers, 300000);

    return allUsers;
  }

  async getOneByGithubId(_githubId: string): Promise<SelectUser | null> {
    return null; // schema no longer contains githubId
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const cacheKey = `user:email:${email}`;

      // Check cache first
      const cached = await this.cacheManager.get<boolean>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Query database
      const [existingUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const exists = !!existingUser;

      // Cache the result for 2 minutes
      await this.cacheManager.set(cacheKey, exists, 120000);

      return exists;
    } catch (error) {
      this.log.error("Error checking email existence:", error);
      return false;
    }
  }

  /**
   * Example of using Redis directly for more advanced operations
   * Like storing a counter or using Redis data structures
   */
  async incrementUserLoginCount(userId: string): Promise<number> {
    const key = `user:${userId}:login_count`;
    const count = await this.redis.incr(key);
    // Set expiry to 30 days
    await this.redis.expire(key, 30 * 24 * 60 * 60);
    return count;
  }

  /**
   * Example of using Redis for session-like data
   */
  async setUserActivity(userId: string, activity: string): Promise<void> {
    const key = `user:${userId}:activity`;
    await this.redis.setex(key, 3600, activity); // Expires in 1 hour
  }

  async getUserActivity(userId: string): Promise<string | null> {
    const key = `user:${userId}:activity`;
    return await this.redis.get(key);
  }

  // async getByQuery(
  //   query: GetUsersRequestDto = {},
  // ): Promise<GetUsersResponseDto> {
  //   const {
  //     id: idArr,
  //     login: loginArr,
  //     name: nameArr,
  //     age: ageArr,
  //     roles: rolesArr,
  //   } = query;

  //   const filterQuery: FilterQuery<IUserEntity> = {
  //     ...(idArr ? { _id: { $in: idArr } } : {}),
  //     ...(loginArr ? { login: { $in: loginArr } } : {}),
  //     ...(nameArr ? { name: { $in: nameArr } } : {}),
  //     ...(ageArr ? { age: { $in: ageArr } } : {}),
  //     ...(rolesArr ? { roles: { $in: rolesArr } } : {}),
  //   };

  //   const foundDocuments = await this.userModel.find(filterQuery);
  //   return {
  //     users: foundDocuments.map((foundDocument) =>
  //       plainToInstance(UserModel, foundDocument.toJSON<IUserModel>()),
  //     ),
  //   };
  // }

  // async getOneByLogin(
  //   dto: GetUserByLoginRequestDto,
  // ): Promise<GetUserByLoginResponseDto> {
  //   const { login } = dto;
  //   const foundDocument = await this.userModel.findOne({ login });

  //   return {
  //     user: plainToInstance(UserModel, foundDocument?.toJSON<IUserModel>()),
  //   };
  // }

  // async updateById(
  //   id: string,
  //   dto: UpdateUserRequestDto,
  // ): Promise<UpdateUserResponseDto> {
  //   const updatedUser = await this.userModel.findByIdAndUpdate(id, dto, {
  //     new: true,
  //   });

  //   return {
  //     user: plainToInstance(UserModel, updatedUser.toJSON<IUserModel>()),
  //   };
  // }

  // async deleteById(id: string): Promise<void> {
  //   await this.userModel.findByIdAndDelete(id);
  // }

  // async deleteAll(): Promise<void> {
  //   await this.userModel.deleteMany({ login: { $gte: '@gmail' } });
  // }
}
