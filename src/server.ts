import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closePool } from './db/index.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'lia-core listening.');
});

server.on('error', (error) => {
  logger.fatal({ err: error }, 'HTTP server failed.');
  process.exit(1);
});

let shuttingDown = false;

function installShutdownHandler(signal: NodeJS.Signals): void {
  process.on(signal, () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, 'Shutting down lia-core HTTP server.');

    const forceShutdownTimer = setTimeout(() => {
      logger.error({ signal }, 'Forced HTTP shutdown after timeout.');
      void closePool().finally(() => {
        process.exit(1);
      });
    }, 10_000);

    forceShutdownTimer.unref();

    server.close((error) => {
      clearTimeout(forceShutdownTimer);

      void closePool()
        .then(() => {
          if (error) {
            logger.error({ err: error, signal }, 'HTTP server shutdown failed.');
            process.exit(1);
            return;
          }

          logger.info({ signal }, 'lia-core HTTP server stopped.');
          process.exit(0);
        })
        .catch((closeError) => {
          logger.error(
            { err: closeError, signal },
            'Failed to close database pool during HTTP shutdown.',
          );
          process.exit(1);
        });
    });
  });
}

installShutdownHandler('SIGTERM');
installShutdownHandler('SIGINT');
