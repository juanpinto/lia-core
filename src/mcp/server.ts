import { logger } from "../config/logger.js";
import { closePool } from "../db/index.js";
import { createMcpHttpApp } from "./app.js";
import { mcpEnv } from "./config.js";

const app = createMcpHttpApp();
const server = app.listen(mcpEnv.MCP_PORT, () => {
  logger.info({ port: mcpEnv.MCP_PORT }, "lia-core MCP listening.");
});

server.on("error", (error) => {
  logger.fatal({ err: error }, "MCP HTTP server failed.");
  process.exit(1);
});

let shuttingDown = false;

function installShutdownHandler(signal: NodeJS.Signals): void {
  process.on(signal, () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, "Shutting down lia-core MCP server.");

    const forceShutdownTimer = setTimeout(() => {
      logger.error({ signal }, "Forced MCP shutdown after timeout.");
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
            logger.error({ err: error, signal }, "MCP server shutdown failed.");
            process.exit(1);
            return;
          }

          logger.info({ signal }, "lia-core MCP server stopped.");
          process.exit(0);
        })
        .catch((closeError) => {
          logger.error(
            { err: closeError, signal },
            "Failed to close database pool during MCP shutdown.",
          );
          process.exit(1);
        });
    });
  });
}

installShutdownHandler("SIGTERM");
installShutdownHandler("SIGINT");
