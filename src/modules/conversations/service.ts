import { NotFoundError } from "../../lib/errors.js";
import { withTransaction } from "../../db/index.js";
import { listUpcomingAppointmentsForCompanyCustomer } from "../appointments/repository.js";
import { findCompanyByPlatformAccountId } from "../channel-accounts/repository.js";
import { resolveCompanyCustomerIds } from "../customers/repository.js";
import { getActivePendingActionForConversation } from "../pending-actions/repository.js";
import {
  createConversationForInbound,
  findReusableConversation,
  getConversationContextBase,
  insertInboundMessage,
  listRecentConversationContextMessages,
} from "./repository.js";
import type { z } from "zod";
import type { IngestInboundMessageBodySchema } from "./schemas.js";

type IngestInboundMessageInput = z.infer<typeof IngestInboundMessageBodySchema>;

export interface IngestInboundConversationMessageResult {
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
  messages: Array<{
    id: string;
    direction: "inbound" | "outbound";
    role: "user" | "assistant" | "tool" | "system" | null;
    body: string | null;
    createdAt: string;
  }>;
  pendingAction: {
    id: string;
    actionType: string;
    payload: Record<string, unknown>;
    createdAt: string;
    expiresAt: string | null;
  } | null;
  recentAppointments: Array<{
    id: string;
    status: string;
    startAtUtc: string;
    endAtUtc: string;
    notes: string | null;
  }>;
}

export async function ingestInboundConversationMessage(
  input: IngestInboundMessageInput,
): Promise<IngestInboundConversationMessageResult> {
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

    const { customerId, companyCustomerId } = await resolveCompanyCustomerIds(
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

    const message = await insertInboundMessage(client, company.id, conversationId, {
      channel: input.channel,
      channelAccountId: company.channelAccountId,
      externalMessageId: input.externalMessageId,
      senderId: input.customerPlatformId,
      body: input.body,
    });

    return {
      customerId,
      companyId: company.id,
      companyName: company.name,
      conversationId: message.conversationId,
      messageId: message.messageId,
    };
  });
}

export async function getConversationContextForBrain(
  companyId: string,
  conversationId: string,
): Promise<ConversationContextForBrain> {
  const base = await getConversationContextBase(companyId, conversationId);
  if (!base) {
    throw new NotFoundError(
      `Conversation ${conversationId} was not found for company ${companyId}.`,
    );
  }

  const [messagesDesc, pendingAction, recentAppointments] = await Promise.all([
    listRecentConversationContextMessages(companyId, conversationId, 10),
    getActivePendingActionForConversation(companyId, conversationId),
    listUpcomingAppointmentsForCompanyCustomer(
      companyId,
      base.companyCustomerId,
      10,
    ),
  ]);

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
    messages: [...messagesDesc].reverse(),
    pendingAction: pendingAction
      ? {
          id: pendingAction.id,
          actionType: pendingAction.actionType,
          payload: pendingAction.payload,
          createdAt: pendingAction.createdAt,
          expiresAt: pendingAction.expiresAt,
        }
      : null,
    recentAppointments: recentAppointments.map((appointment) => ({
      id: appointment.id,
      status: appointment.status,
      startAtUtc: appointment.startAtUtc,
      endAtUtc: appointment.endAtUtc,
      notes: appointment.notes,
    })),
  };
}
