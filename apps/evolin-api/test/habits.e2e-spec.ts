import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { isoWeekday } from '@repo/evolin-shared';

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
    await pool.query(
      'truncate table habit_status_events, practice_records, habits cascade',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a fourth establishing habit without changing it', async () => {
    for (const title of ['One', 'Two', 'Three']) {
      await createEstablishingHabit(server, title).expect(201);
    }

    const backlogResponse = await request(server)
      .post('/v1/habits')
      .send({
        ...completeHabit('Four'),
        ...requestContext(),
        startEstablishing: false,
      })
      .expect(201);

    const response = await request(server)
      .post(`/v1/habits/${backlogResponse.body.habit.id}/activate`)
      .send(requestContext())
      .expect(409);

    expect(response.body.code).toBe('CAPACITY_EXCEEDED');

    const detail = await request(server)
      .get(`/v1/habits/${backlogResponse.body.habit.id}`)
      .query(requestContext())
      .expect(200);
    expect(detail.body.habit.status).toBe('backlog');
  });

  it('upserts one practice row and preserves it after a schedule edit', async () => {
    const createResponse = await createEstablishingHabit(server, 'Walk').expect(
      201,
    );
    const habitId = createResponse.body.habit.id as string;
    const context = requestContext();

    await request(server)
      .put(`/v1/habits/${habitId}/practices/${context.date}`)
      .send({ outcome: 'completed', timeZone: context.timeZone })
      .expect(200);

    await request(server)
      .patch(`/v1/habits/${habitId}`)
      .send({
        weekdays: [isoWeekday(context.date, context.timeZone) === 1 ? 2 : 1],
        ...context,
      })
      .expect(200);

    await request(server)
      .put(`/v1/habits/${habitId}/practices/${context.date}`)
      .send({ outcome: 'skipped', timeZone: context.timeZone })
      .expect(200);

    const history = await request(server)
      .get(`/v1/habits/${habitId}/practices`)
      .query({
        timeZone: context.timeZone,
        from: context.date,
        to: context.date,
      })
      .expect(200);

    expect(history.body.practices).toHaveLength(1);
    expect(history.body.practices[0].outcome).toBe('skipped');
  });

  it('rejects a new practice row whose weekday is off-schedule', async () => {
    const context = requestContext();
    const todayWeekday = isoWeekday(context.date, context.timeZone);
    const createResponse = await request(server)
      .post('/v1/habits')
      .send({
        ...completeHabit('Off schedule'),
        weekdays: [todayWeekday === 1 ? 2 : 1],
        ...context,
        startEstablishing: true,
      })
      .expect(201);

    const response = await request(server)
      .put(
        `/v1/habits/${createResponse.body.habit.id}/practices/${context.date}`,
      )
      .send({ outcome: 'completed', timeZone: context.timeZone })
      .expect(409);

    expect(response.body.code).toBe('PRACTICE_NOT_SCHEDULED');
  });

  it('graduates without deleting practice history', async () => {
    const createResponse = await createEstablishingHabit(server, 'Read').expect(
      201,
    );
    const habitId = createResponse.body.habit.id as string;
    const context = requestContext();

    await request(server)
      .put(`/v1/habits/${habitId}/practices/${context.date}`)
      .send({ outcome: 'completed', timeZone: context.timeZone })
      .expect(200);

    const graduate = await request(server)
      .post(`/v1/habits/${habitId}/graduate`)
      .send(context)
      .expect(200);

    expect(graduate.body.habit.status).toBe('established');
    expect(graduate.body.capacity.used).toBe(0);

    const history = await request(server)
      .get(`/v1/habits/${habitId}/practices`)
      .query({
        timeZone: context.timeZone,
        from: context.date,
        to: context.date,
      })
      .expect(200);
    expect(history.body.practices).toHaveLength(1);
  });
});

function createEstablishingHabit(server: Server, title: string) {
  return request(server)
    .post('/v1/habits')
    .send({
      ...completeHabit(title),
      ...requestContext(),
      startEstablishing: true,
    });
}

function completeHabit(title: string) {
  const context = requestContext();
  return {
    title,
    category: 'health',
    why: 'It matters',
    minimumAction: 'Do one minute',
    trigger: 'After breakfast',
    weekdays: [isoWeekday(context.date, context.timeZone)],
    estimatedDurationMinutes: 1,
  };
}

function requestContext() {
  const now = new Date();
  return {
    timeZone: 'UTC',
    date: now.toISOString().slice(0, 10),
  };
}
