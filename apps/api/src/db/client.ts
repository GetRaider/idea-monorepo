import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { processEnv } from '../helpers/processEnv.helper';

const connectionString = processEnv.DB_URL;

export const pool = new Pool({ connectionString });
export const db = drizzle(pool);
