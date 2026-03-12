import { NotFoundError } from "../../lib/errors.js";
import { ingestInboundMessage } from "./repository.js";
import type { z } from "zod";
import type {
  AddMessageBodySchema,
  CreateConversationBodySchema,
  IngestInboundMessageBodySchema,
} from "./schemas.js";

type CreateConversationInput = z.infer<typeof CreateConversationBodySchema>;
type AddMessageInput = z.infer<typeof AddMessageBodySchema>;
type IngestInboundMessageInput = z.infer<typeof IngestInboundMessageBodySchema>;

export async function ingestInboundConversationMessage(
  input: IngestInboundMessageInput,
) {
  return ingestInboundMessage(input);
}
