import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";

const ProductSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().int().nullable(),
});

const InputSchema = z.object({
  companyId: z.uuid(),
});

const OutputSchema = z.object({
  products: z.array(ProductSchema),
});

export function registerListProductsTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "products_list",
    {
      title: "List Products",
      description: "List all active products for a company.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const products = await ctx.products.listActiveProducts(args.companyId);
        return ok({
          products: products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
          })),
        });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
