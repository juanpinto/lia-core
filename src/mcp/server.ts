import { logger } from "../config/logger.js";
import { createMcpHttpApp } from "./app.js";
import { mcpEnv } from "./config.js";

const app = createMcpHttpApp();

app.listen(mcpEnv.MCP_PORT, () => {
  logger.info({ port: mcpEnv.MCP_PORT }, "lia-core MCP listening.");
});
