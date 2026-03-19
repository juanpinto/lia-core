import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import {
  ConversationContextOutputSchema,
  ProcessInboundMessageInputSchema,
} from "./types.js";

export function registerProcessInboundMessageTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "process_inbound_message",
    {
      title: "Process Inbound Message",
      description:
        "Process an inbound message and return the updated conversation context, including recent messages and pending action.",
      inputSchema: ProcessInboundMessageInputSchema,
      outputSchema: ConversationContextOutputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const context = await ctx.conversations.processInboundMessage(args);

        return ok({ context });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
