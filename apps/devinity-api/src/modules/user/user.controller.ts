import { Controller, Get, Post, Body, Param, Logger } from "@nestjs/common";
import { UserService } from "./user.service";
import { SelectUser } from "../../db/schema";

@Controller("users")
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(): Promise<SelectUser[]> {
    return this.userService.getAll();
  }

  @Post()
  async createUser(@Body() dto: Partial<SelectUser>): Promise<SelectUser> {
    return this.userService.create(dto);
  }

  @Get("email-exists/:email")
  async checkEmail(
    @Param("email") email: string,
  ): Promise<{ exists: boolean }> {
    const exists = await this.userService.checkEmailExists(email);
    return { exists };
  }

  @Post(":id/activity")
  async setActivity(
    @Param("id") userId: string,
    @Body("activity") activity: string,
  ): Promise<{ success: boolean }> {
    await this.userService.setUserActivity(userId, activity);
    return { success: true };
  }

  @Get(":id/activity")
  async getActivity(
    @Param("id") userId: string,
  ): Promise<{ activity: string | null }> {
    const activity = await this.userService.getUserActivity(userId);
    return { activity };
  }

  @Post(":id/login")
  async recordLogin(
    @Param("id") userId: string,
  ): Promise<{ loginCount: number }> {
    const count = await this.userService.incrementUserLoginCount(userId);
    this.logger.log(`User ${userId} login count: ${count}`);
    return { loginCount: count };
  }
}
