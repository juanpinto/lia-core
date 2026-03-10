import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpContext } from "./context.js";
import { registerResolveCustomerTool } from "./tools/customers/resolve.js";
import { registerSearchProductsTool } from "./tools/products/search.js";
import { registerListAppointmentsTool } from "./tools/appointments/list.js";
import { registerCreateAppointmentTool } from "./tools/appointments/create.js";
import { registerCancelAppointmentTool } from "./tools/appointments/cancel.js";
import { registerRescheduleAppointmentTool } from "./tools/appointments/reschedule.js";

export function createLiaCoreMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "lia-core",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  const ctx = createMcpContext();

  registerResolveCustomerTool(server, ctx);
  registerSearchProductsTool(server, ctx);
  registerListAppointmentsTool(server, ctx);
  registerCreateAppointmentTool(server, ctx);
  registerCancelAppointmentTool(server, ctx);
  registerRescheduleAppointmentTool(server, ctx);

  return server;
}
