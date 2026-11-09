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
} from '@nestjs/common';
import { z } from 'zod';

import {
  createHabitSchema,
  practiceHistoryQuerySchema,
  putPracticeSchema,
  requestContextSchema,
  timeZoneSchema,
  transitionHabitSchema,
  updateHabitSchema,
  type CreateHabitInput,
  type PracticeHistoryQuery,
  type PutPracticeInput,
  type TransitionHabitInput,
  type UpdateHabitInput,
} from '@repo/evolin-shared';

import { ZodPipe } from '../http/zod.pipe';
import { type HabitAction } from './habit-transitions';
import { HabitsService } from './habits.service';

const deletePracticeQuerySchema = z
  .object({ timeZone: timeZoneSchema })
  .strict();

@Controller('habits')
export class HabitsController {
  constructor(
    @Inject(HabitsService) private readonly habitsService: HabitsService,
  ) {}

  @Get()
  list(
    @Query(new ZodPipe(requestContextSchema)) query: TransitionHabitInput,
  ) {
    return this.habitsService.list(query);
  }

  @Post()
  @HttpCode(201)
  create(
    @Body(new ZodPipe(createHabitSchema)) body: CreateHabitInput,
  ) {
    return this.habitsService.create(body);
  }

  @Get(':id')
  detail(
    @Param('id') habitId: string,
    @Query(new ZodPipe(requestContextSchema)) query: TransitionHabitInput,
  ) {
    return this.habitsService.detail(habitId, query);
  }

  @Patch(':id')
  update(
    @Param('id') habitId: string,
    @Body(new ZodPipe(updateHabitSchema)) body: UpdateHabitInput,
  ) {
    return this.habitsService.update(habitId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') habitId: string): Promise<void> {
    await this.habitsService.delete(habitId);
  }

  @Post(':id/activate')
  @HttpCode(200)
  activate(
    @Param('id') habitId: string,
    @Body(new ZodPipe(transitionHabitSchema)) body: TransitionHabitInput,
  ) {
    return this.transition(habitId, 'activate', body);
  }

  @Post(':id/pause')
  @HttpCode(200)
  pause(
    @Param('id') habitId: string,
    @Body(new ZodPipe(transitionHabitSchema)) body: TransitionHabitInput,
  ) {
    return this.transition(habitId, 'pause', body);
  }

  @Post(':id/resume')
  @HttpCode(200)
  resume(
    @Param('id') habitId: string,
    @Body(new ZodPipe(transitionHabitSchema)) body: TransitionHabitInput,
  ) {
    return this.transition(habitId, 'resume', body);
  }

  @Post(':id/backlog')
  @HttpCode(200)
  moveToBacklog(
    @Param('id') habitId: string,
    @Body(new ZodPipe(transitionHabitSchema)) body: TransitionHabitInput,
  ) {
    return this.transition(habitId, 'backlog', body);
  }

  @Post(':id/graduate')
  @HttpCode(200)
  graduate(
    @Param('id') habitId: string,
    @Body(new ZodPipe(transitionHabitSchema)) body: TransitionHabitInput,
  ) {
    return this.transition(habitId, 'graduate', body);
  }

  @Put(':id/practices/:date')
  putPractice(
    @Param('id') habitId: string,
    @Param('date') date: string,
    @Body(new ZodPipe(putPracticeSchema)) body: PutPracticeInput,
  ) {
    return this.habitsService.putPractice(habitId, date, body);
  }

  @Delete(':id/practices/:date')
  @HttpCode(204)
  async deletePractice(
    @Param('id') habitId: string,
    @Param('date') date: string,
    @Query(new ZodPipe(deletePracticeQuerySchema))
    query: z.infer<typeof deletePracticeQuerySchema>,
  ): Promise<void> {
    await this.habitsService.deletePractice(habitId, date, query.timeZone);
  }

  @Get(':id/practices')
  listPractices(
    @Param('id') habitId: string,
    @Query(new ZodPipe(practiceHistoryQuerySchema))
    query: PracticeHistoryQuery,
  ) {
    return this.habitsService.listPractices(habitId, query);
  }

  private transition(
    habitId: string,
    action: HabitAction,
    body: TransitionHabitInput,
  ) {
    return this.habitsService.transition(habitId, action, body);
  }
}
