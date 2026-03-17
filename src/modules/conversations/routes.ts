import { Router } from "express";
import { requireHttpService } from "../../auth/http.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/http.js";
import { validateRequest } from "../../lib/validate.js";
import { ingestInboundConversationMessage } from "./service.js";
import {
  IngestInboundMessageBodySchema,
} from "./schemas.js";

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.post(
  "/inbound-messages",
  requireHttpService("gateway"),
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, {
      body: IngestInboundMessageBodySchema,
    });

    const result = await ingestInboundConversationMessage(body);
    ok(res, result, 201);
  }),
);

conversationsRouter.use(requireHttpService("internal"));
