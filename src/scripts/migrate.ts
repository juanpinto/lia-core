import { logger } from '../config/logger.js';
import { pool } from '../db/index.js';
import { runMigrations } from '../db/migrator.js';

async function main(): Promise<void> {
  await runMigrations();
  logger.info('Migrations completed successfully.');
}

void main()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Migration failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
