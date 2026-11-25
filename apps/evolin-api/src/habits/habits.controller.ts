import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";

import {
  createHabitSchema,
  isoDateSchema,
  putCheckInSchema,
  requestContextSchema,
  startEstablishingSchema,
  updateHabitSchema,
  type CreateHabitInput,
  type PutCheckInInput,
  type RequestContext,
  type UpdateHabitInput,
} from "@repo/evolin-shared";

import { ApiError } from "../http/api-error";
import { ZodPipe } from "../http/zod.pipe";
import { HabitsService } from "./habits.service";

@Controller("habits")
export class HabitsController {
  constructor(
    @Inject(HabitsService) private readonly habitsService: HabitsService,
  ) {}

  @Get()
  list(@Query(new ZodPipe(requestContextSchema)) query: RequestContext) {
    return this.habitsService.list(query);
  }

  @Post()
  @HttpCode(201)
  create(@Body(new ZodPipe(createHabitSchema)) body: CreateHabitInput) {
    return this.habitsService.create(body);
  }

  @Get("week")
  week(@Query(new ZodPipe(requestContextSchema)) query: RequestContext) {
    return this.habitsService.week(query);
  }

  @Get(":id")
  detail(
    @Param("id") habitId: string,
    @Query(new ZodPipe(requestContextSchema)) query: RequestContext,
  ) {
    return this.habitsService.detail(habitId, query);
  }

  @Patch(":id")
  update(
    @Param("id") habitId: string,
    @Body(new ZodPipe(updateHabitSchema)) body: UpdateHabitInput,
  ) {
    return this.habitsService.update(habitId, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(@Param("id") habitId: string): Promise<void> {
    await this.habitsService.delete(habitId);
  }

  @Post(":id/start")
  @HttpCode(200)
  start(
    @Param("id") habitId: string,
    @Body(new ZodPipe(startEstablishingSchema)) body: RequestContext,
  ) {
    return this.habitsService.startEstablishing(habitId, body);
  }

  @Put(":id/check-ins/:date/:checkpointIndex")
  putCheckIn(
    @Param("id") habitId: string,
    @Param("date") date: string,
    @Param("checkpointIndex") checkpointIndex: string,
    @Body(new ZodPipe(putCheckInSchema)) body: PutCheckInInput,
  ) {
    isoDateSchema.parse(date);
    const parsedIndex = Number(checkpointIndex);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Checkpoint index must be a whole number.",
      );
    }

    return this.habitsService.putCheckIn(habitId, date, parsedIndex, body);
  }
}
