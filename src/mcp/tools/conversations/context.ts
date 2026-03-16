import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import { InputSchema, OutputSchema } from "./types.js";

export function registerConversationContextTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "conversations_context",
    {
      title: "Get Conversation Context",
      description:
        "Get the initial conversation context, including recent messages, pending action, and upcoming appointments.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const context = await ctx.conversations.getConversationContext(
          args.companyId,
          args.conversationId,
        );

        return ok({ context });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
