import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import {
  ProcessOutboundMessageInputSchema,
  ProcessOutboundMessageOutputSchema,
} from "./types.js";

export function registerProcessOutboundMessageTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "process_outbound_message",
    {
      title: "Process Outbound Message",
      description:
        "Process an outbound message for an existing open conversation and apply the optional summary patch.",
      inputSchema: ProcessOutboundMessageInputSchema,
      outputSchema: ProcessOutboundMessageOutputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const result = await ctx.conversations.processOutboundMessage(args);
        return ok({ result });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
