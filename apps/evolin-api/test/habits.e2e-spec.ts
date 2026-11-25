import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  addDays,
  isoWeekday,
  type CreateHabitInput,
} from '@repo/evolin-shared';

import { AppModule } from '../src/app.module';
import { DATABASE_POOL } from '../src/database/database.module';

describe('habits API', () => {
  let app: INestApplication;
  let server: Server;
  let pool: Pool;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('v1', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    await app.init();
    server = app.getHttpServer() as Server;
    pool = app.get<Pool>(DATABASE_POOL);
  });

  beforeEach(async () => {
    await pool.query('truncate table check_ins, habits cascade');
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks a third establishing habit in a full life area and allows another area', async () => {
    const first = await createHabit(server, 'One');
    const second = await createHabit(server, 'Two');
    const third = await createHabit(server, 'Three');
    const elsewhere = await createHabit(server, 'Elsewhere', 'mind');

    await startHabit(server, first).expect(200);
    await startHabit(server, second).expect(200);

    const blocked = await startHabit(server, third).expect(409);
    expect(blocked.body.code).toBe('AREA_FULL');
    expect(blocked.body.message).toContain('Health is full');

    const detail = await request(server)
      .get(`/v1/habits/${third}`)
      .query(requestContext())
      .expect(200);
    expect(detail.body.habit.status).toBe('backlog');

    const started = await startHabit(server, elsewhere).expect(200);
    expect(started.body.habit.status).toBe('establishing');
    const health = started.body.lifeAreas.find(
      (lifeArea: { id: string }) => lifeArea.id === 'health',
    );
    expect(health.slotsUsed).toBe(2);
  });

  it('stores a skip reason and rejects a skip without one', async () => {
    const habitId = await createHabit(server, 'Walk');
    await startHabit(server, habitId).expect(200);
    const context = requestContext();

    const rejected = await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/0`)
      .send({ status: 'skipped', timeZone: context.timeZone })
      .expect(400);
    expect(rejected.body.code).toBe('VALIDATION_ERROR');

    await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/0`)
      .send({
        status: 'skipped',
        skipReason: 'travel',
        timeZone: context.timeZone,
      })
      .expect(200);

    const detail = await request(server)
      .get(`/v1/habits/${habitId}`)
      .query(context)
      .expect(200);
    expect(detail.body.habit.todayCheckpoints[0]).toMatchObject({
      status: 'skipped',
      skipReason: 'travel',
    });
    expect(detail.body.checkIns).toHaveLength(1);
  });

  it('records checkpoints independently', async () => {
    const habitId = await createHabit(server, 'Water', 'health', {
      checkpointsPerDay: 3,
    });
    await startHabit(server, habitId).expect(200);
    const context = requestContext();

    await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/0`)
      .send({ status: 'completed', timeZone: context.timeZone })
      .expect(200);
    await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/1`)
      .send({ status: 'failed', timeZone: context.timeZone })
      .expect(200);

    const detail = await request(server)
      .get(`/v1/habits/${habitId}`)
      .query(context)
      .expect(200);
    expect(
      detail.body.habit.todayCheckpoints.map(
        (checkpoint: { status: string }) => checkpoint.status,
      ),
    ).toEqual(['completed', 'failed', 'open']);
  });

  it('establishes on the rule and keeps check-in history', async () => {
    const habitId = await createHabit(server, 'Wake up');
    await startHabit(server, habitId).expect(200);
    const context = requestContext();
    const startedOn = addDays(context.date, -29);

    await pool.query(
      `update habits set establishing_started_at = $2 where id = $1`,
      [habitId, new Date(`${startedOn}T12:00:00.000Z`)],
    );
    for (let offset = 1; offset <= 8; offset += 1) {
      await pool.query(
        `insert into check_ins (
          id, habit_id, check_in_date, checkpoint_index, status, created_at, updated_at
        ) values ($1, $2, $3, 0, 'completed', now(), now())`,
        [crypto.randomUUID(), habitId, addDays(context.date, -offset)],
      );
    }
    await pool.query(
      `insert into check_ins (
        id, habit_id, check_in_date, checkpoint_index, status, created_at, updated_at
      ) values ($1, $2, $3, 0, 'failed', now(), now())`,
      [crypto.randomUUID(), habitId, addDays(context.date, -9)],
    );

    const stillEstablishing = await request(server)
      .get(`/v1/habits/${habitId}`)
      .query(context)
      .expect(200);
    expect(stillEstablishing.body.habit.status).toBe('establishing');
    expect(stillEstablishing.body.habit.completionRate).toBeCloseTo(8 / 9);

    const established = await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/0`)
      .send({ status: 'completed', timeZone: context.timeZone })
      .expect(200);
    expect(established.body.habit.status).toBe('established');
    expect(established.body.habit.establishedAt).toEqual(expect.any(String));
    const health = established.body.lifeAreas.find(
      (lifeArea: { id: string }) => lifeArea.id === 'health',
    );
    expect(health.slotsUsed).toBe(0);

    const history = await request(server)
      .get(`/v1/habits/${habitId}`)
      .query(context)
      .expect(200);
    expect(history.body.checkIns).toHaveLength(10);
    expect(history.body.habit.scheduledToday).toBe(false);
  });

  it('keeps a streak across a skip and drops it on a failure', async () => {
    const habitId = await createHabit(server, 'Read', 'health', {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
    });
    await startHabit(server, habitId).expect(200);
    const context = requestContext();
    await pool.query(
      `update habits set establishing_started_at = $2 where id = $1`,
      [habitId, new Date(`${addDays(context.date, -10)}T12:00:00.000Z`)],
    );
    for (let offset = 1; offset <= 6; offset += 1) {
      await pool.query(
        `insert into check_ins (
          id, habit_id, check_in_date, checkpoint_index, status, created_at, updated_at
        ) values ($1, $2, $3, 0, 'completed', now(), now())`,
        [crypto.randomUUID(), habitId, addDays(context.date, -offset)],
      );
    }

    const skipped = await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/0`)
      .send({
        status: 'skipped',
        skipReason: 'day_off',
        timeZone: context.timeZone,
      })
      .expect(200);
    expect(skipped.body.habit.streak).toBe(6);

    const failed = await request(server)
      .put(`/v1/habits/${habitId}/check-ins/${context.date}/0`)
      .send({ status: 'failed', timeZone: context.timeZone })
      .expect(200);
    expect(failed.body.habit.streak).toBe(0);
  });
});

async function createHabit(
  server: Server,
  name: string,
  lifeAreaId: CreateHabitInput['lifeAreaId'] = 'health',
  overrides: Partial<CreateHabitInput> = {},
): Promise<string> {
  const context = requestContext();
  const response = await request(server)
    .post('/v1/habits')
    .send({
      lifeAreaId,
      name,
      why: 'It matters',
      trigger: 'After breakfast',
      acceptanceCriteria: 'Do the action once',
      checkpointsPerDay: 1,
      checkpointLabels: null,
      weekdays: [isoWeekday(context.date, context.timeZone)],
      ...overrides,
    })
    .expect(201);

  return response.body.habit.id as string;
}

function startHabit(server: Server, habitId: string) {
  return request(server)
    .post(`/v1/habits/${habitId}/start`)
    .send(requestContext());
}

function requestContext() {
  const now = new Date();
  return {
    timeZone: 'UTC',
    date: now.toISOString().slice(0, 10),
  };
}
