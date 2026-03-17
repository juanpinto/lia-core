import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { sharedEnv } from '../config/shared-env.js';
import { logger } from '../config/logger.js';

export const pool = new Pool({
  connectionString: sharedEnv.DATABASE_URL,
  max: sharedEnv.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  query_timeout: 20_000,
  application_name: 'lia-core',
});

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected Postgres pool error.');
});

let poolClosePromise: Promise<void> | null = null;

export interface DbClient {
  query<R extends QueryResultRow = QueryResultRow>(text: string, params?: readonly unknown[]): Promise<QueryResult<R>>;
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await pool.query('select 1');
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Database health check failed.');
    return false;
  }
}

export function closePool(): Promise<void> {
  if (!poolClosePromise) {
    poolClosePromise = pool.end();
  }

  return poolClosePromise;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
