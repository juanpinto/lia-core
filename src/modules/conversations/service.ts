import { NotFoundError } from "../../lib/errors.js";
import { withTransaction } from "../../db/index.js";
import { findCompanyByPlatformAccountId } from "../channel-accounts/repository.js";
import { resolveCompanyCustomerIds } from "../customers/repository.js";
import {
  appendConversationSummaryPatch,
  createConversationForInbound,
  findProcessOutboundMessageTarget,
  findReusableConversation,
  getConversationContextBase,
  insertInboundMessage,
  insertOutboundMessage,
  listRecentConversationContextMessages,
} from "./repository.js";
import type { z } from "zod";
import type {
  ProcessInboundMessageBodySchema,
  ProcessOutboundMessageBodySchema,
} from "./schemas.js";

type ProcessInboundMessageInput = z.infer<
  typeof ProcessInboundMessageBodySchema
>;
type ProcessOutboundMessageInput = z.infer<
  typeof ProcessOutboundMessageBodySchema
>;

interface PersistInboundMessageResult {
  companyId: string;
  conversationId: string;
}

interface ProcessOutboundMessageResult {
  customerId: string;
  companyId: string;
  companyName: string;
  conversationId: string;
  messageId: string;
}

export interface ConversationContextForBrain {
  company: {
    id: string;
    name: string;
    timezone: string;
    platformAccountId: string;
  };
  customer: {
    id: string;
    name: string | null;
    channel: "whatsapp" | "instagram" | "web" | "manual";
    platformAccountId: string;
  };
  conversation: {
    id: string;
    startedAt: string;
    updatedAt: string;
  };
  conversationHistory: Array<{
    id: string;
    direction: "inbound" | "outbound";
    role: "user" | "assistant" | "tool" | "system" | null;
    body: string | null;
    createdAt: string;
  }>;
}

async function persistInboundMessage(
  input: ProcessInboundMessageInput,
): Promise<PersistInboundMessageResult> {
  return withTransaction(async (client) => {
    const company = await findCompanyByPlatformAccountId(
      client,
      input.channel,
      input.companyPlatformId,
    );

    if (!company) {
      throw new NotFoundError(
        `Company was not found for channel=${input.channel} and platformAccountId=${input.companyPlatformId}.`,
      );
    }

    const { companyCustomerId } = await resolveCompanyCustomerIds(
      client,
      company.id,
      {
        customerName: input.customerName ?? null,
        channel: input.channel,
        platformUserId: input.customerPlatformId,
      },
    );

    let conversationId = await findReusableConversation(
      client,
      company.id,
      companyCustomerId,
      input.channel,
      company.channelAccountId,
    );

    if (!conversationId) {
      conversationId = await createConversationForInbound(client, company.id, {
        companyCustomerId,
        channel: input.channel,
        channelAccountId: company.channelAccountId,
      });
    }

    const message = await insertInboundMessage(
      client,
      company.id,
      conversationId,
      {
        channel: input.channel,
        channelAccountId: company.channelAccountId,
        externalMessageId: input.externalMessageId,
        senderId: input.customerPlatformId,
        body: input.body,
      },
    );

    return {
      companyId: company.id,
      conversationId: message.conversationId,
    };
  });
}

export async function processInboundMessage(
  input: ProcessInboundMessageInput,
): Promise<ConversationContextForBrain> {
  const result = await persistInboundMessage(input);
  return getConversationContext(result.companyId, result.conversationId);
}

export async function processOutboundMessage(
  input: ProcessOutboundMessageInput,
): Promise<ProcessOutboundMessageResult> {
  return withTransaction(async (client) => {
    const target = await findProcessOutboundMessageTarget(
      client,
      input.companyId,
      input.customerId,
      input.channel,
    );

    if (!target) {
      throw new NotFoundError(
        `Open conversation was not found for companyId=${input.companyId}, customerId=${input.customerId}, channel=${input.channel}.`,
      );
    }

    const message = await insertOutboundMessage(
      client,
      input.companyId,
      target.conversationId,
      {
        channel: input.channel,
        channelAccountId: target.channelAccountId,
        externalMessageId: input.externalMessageId,
        senderId: target.companyPlatformAccountId,
        body: input.body,
      },
    );

    const summaryPatch = input.summary_patch.trim();
    if (message.created && summaryPatch) {
      await appendConversationSummaryPatch(
        client,
        input.companyId,
        message.conversationId,
        summaryPatch,
      );
    }

    return {
      customerId: input.customerId,
      companyId: input.companyId,
      companyName: target.companyName,
      conversationId: message.conversationId,
      messageId: message.messageId,
    };
  });
}

async function getConversationContext(
  companyId: string,
  conversationId: string,
): Promise<ConversationContextForBrain> {
  const base = await getConversationContextBase(companyId, conversationId);
  if (!base) {
    throw new NotFoundError(
      `Conversation ${conversationId} was not found for company ${companyId}.`,
    );
  }

  const conversationHistory = await listRecentConversationContextMessages(
    companyId,
    conversationId,
    10,
  );

  return {
    company: {
      id: base.companyId,
      name: base.companyName,
      timezone: base.companyTimezone,
      platformAccountId: base.companyPlatformAccountId ?? "",
    },
    customer: {
      id: base.customerId,
      name: base.customerName,
      channel: base.customerChannel,
      platformAccountId: base.customerPlatformAccountId,
    },
    conversation: {
      id: base.conversationId,
      startedAt: base.startedAt,
      updatedAt: base.updatedAt,
    },
    conversationHistory: [...conversationHistory].reverse(),
  };
}
