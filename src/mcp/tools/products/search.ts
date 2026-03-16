import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";

const ProductSchema = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  price: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

const InputSchema = z.object({
  companyId: z.uuid(),
  query: z.string().trim().min(1),
});

const OutputSchema = z.object({
  products: z.array(ProductSchema),
});

export function registerSearchProductsTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "products_search",
    {
      title: "Search Products",
      description: "Search a product/service for a company.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const products = await ctx.products.searchCompanyProduct(
          args.companyId,
          args.query,
        );
        return ok({ products });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
