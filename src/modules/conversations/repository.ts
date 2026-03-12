import type { PoolClient } from "pg";
import { env } from "../../config/env.js";
import { NotFoundError } from "../../lib/errors.js";
import { pool, withTransaction } from "../../db/index.js";
import type { z } from "zod";
import type {
  AddMessageBodySchema,
  CreateConversationBodySchema,
  IngestInboundMessageBodySchema,
} from "./schemas.js";

type CreateConversationInput = z.infer<typeof CreateConversationBodySchema>;
type AddMessageInput = z.infer<typeof AddMessageBodySchema>;
type IngestInboundMessageInput = z.infer<typeof IngestInboundMessageBodySchema>;

export interface ConversationRecord {
  id: string;
  companyId: string;
  companyCustomerId: string;
  channelAccountId: string | null;
  channel: string;
  status: "open" | "closed";
  metadata: Record<string, unknown> | null;
  summary: string | null;
  summaryUpdatedAt: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  companyId: string;
  conversationId: string;
  channel: string;
  channelAccountId: string | null;
  externalMessageId: string;
  direction: "inbound" | "outbound";
  senderId: string | null;
  body: string | null;
  raw: Record<string, unknown> | null;
  role: "user" | "assistant" | "system" | "tool" | null;
  createdAt: string;
}

export interface IngestInboundMessageResult {
  customerId: string;
  companyId: string;
  companyName: string;
  conversationId: string;
  messageId: string;
}

function mapConversationRow(row: Record<string, unknown>): ConversationRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyCustomerId: String(row.company_customer_id),
    channelAccountId: (row.channel_account_id as string | null) ?? null,
    channel: String(row.channel),
    status: row.status as ConversationRecord["status"],
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    summaryUpdatedAt: row.summary_updated_at
      ? new Date(String(row.summary_updated_at)).toISOString()
      : null,
    startedAt: new Date(String(row.started_at)).toISOString(),
    endedAt: row.ended_at ? new Date(String(row.ended_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapMessageRow(row: Record<string, unknown>): MessageRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    conversationId: String(row.conversation_id),
    channel: String(row.channel),
    channelAccountId: (row.channel_account_id as string | null) ?? null,
    externalMessageId: String(row.external_message_id),
    direction: row.direction as MessageRecord["direction"],
    senderId: (row.sender_id as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    raw: (row.raw as Record<string, unknown> | null) ?? null,
    role: (row.role as MessageRecord["role"]) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

async function getCompanyByPlatformAccountId(
  client: PoolClient,
  channel: string,
  platformAccountId: string,
): Promise<{
  id: string;
  name: string;
  channelAccountId: string;
}> {
  const result = await client.query(
    `
    select
      c.id as company_id,
      c.name as company_name,
      ca.id as channel_account_id
    from public.channel_accounts ca
    inner join public.companies c
      on c.id = ca.company_id
    where ca.channel = $1
      and ca.platform_account_id = $2
    limit 1
    `,
    [channel, platformAccountId],
  );

  if (!result.rowCount) {
    throw new NotFoundError(
      `Company was not found for channel=${channel} and platformAccountId=${platformAccountId}.`,
    );
  }

  return {
    id: String(result.rows[0]!.company_id),
    name: String(result.rows[0]!.company_name),
    channelAccountId: String(result.rows[0]!.channel_account_id),
  };
}

async function resolveCustomerForCompany(
  client: PoolClient,
  companyId: string,
  input: {
    customerName?: string | null;
    channel: string;
    platformUserId: string;
  },
): Promise<{ customerId: string; companyCustomerId: string }> {
  const customerResult = await client.query(
    `
    insert into public.customers (
      name,
      channel,
      platform_user_id
    )
    values ($1, $2, $3)
    on conflict (channel, platform_user_id)
    do update
      set name = coalesce(excluded.name, public.customers.name),
          updated_at = now()
    returning id
    `,
    [input.customerName ?? null, input.channel, input.platformUserId],
  );

  const customerId = String(customerResult.rows[0]!.id);

  const companyCustomerResult = await client.query(
    `
    insert into public.company_customers (company_id, customer_id)
    values ($1, $2)
    on conflict (company_id, customer_id)
    do update
      set updated_at = now()
    returning id
    `,
    [companyId, customerId],
  );

  return {
    customerId,
    companyCustomerId: String(companyCustomerResult.rows[0]!.id),
  };
}

async function findReusableConversation(
  client: PoolClient,
  companyId: string,
  companyCustomerId: string,
  channel: string,
  channelAccountId: string | null,
): Promise<string | null> {
  const result = await client.query(
    `
    select c.id
    from public.conversations c
    where c.company_id = $1
      and c.company_customer_id = $2
      and c.channel = $3
      and c.status = 'open'
      and (
        ($4::uuid is not null and c.channel_account_id = $4::uuid)
        or
        ($4::uuid is null)
      )
      and c.updated_at >= now() - ($5::int * interval '1 hour')
    order by c.updated_at desc
    limit 1
    `,
    [companyId, companyCustomerId, channel, channelAccountId, 24],
  );

  return result.rowCount ? String(result.rows[0]!.id) : null;
}

async function createConversation(
  client: PoolClient,
  companyId: string,
  input: {
    companyCustomerId: string;
    channel: string;
    channelAccountId: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<string> {
  const result = await client.query(
    `
    insert into public.conversations
      (company_id, company_customer_id, channel_account_id, channel, metadata)
    values ($1, $2, $3, $4, $5)
    returning id
    `,
    [
      companyId,
      input.companyCustomerId,
      input.channelAccountId,
      input.channel,
      input.metadata ?? null,
    ],
  );

  return String(result.rows[0]!.id);
}

async function getExistingMessageByExternalId(
  client: PoolClient,
  companyId: string,
  channel: string,
  externalMessageId: string,
): Promise<{ messageId: string; conversationId: string }> {
  const result = await client.query(
    `
    select id, conversation_id
    from public.messages
    where company_id = $1
      and channel = $2
      and external_message_id = $3
    limit 1
    `,
    [companyId, channel, externalMessageId],
  );

  return {
    messageId: String(result.rows[0]!.id),
    conversationId: String(result.rows[0]!.conversation_id),
  };
}

async function insertInboundMessage(
  client: PoolClient,
  companyId: string,
  conversationId: string,
  input: {
    channel: string;
    channelAccountId: string | null;
    externalMessageId: string;
    senderId: string | null;
    body?: string | null;
  },
): Promise<{ messageId: string; conversationId: string }> {
  const inserted = await client.query(
    `
    insert into public.messages
      (
        company_id,
        conversation_id,
        channel_account_id,
        channel,
        external_message_id,
        direction,
        sender_id,
        body,
        role
      )
    values ($1, $2, $3, $4, $5, 'inbound', $6, $7, 'user')
    on conflict (company_id, channel, external_message_id)
    do nothing
    returning id, conversation_id
    `,
    [
      companyId,
      conversationId,
      input.channelAccountId,
      input.channel,
      input.externalMessageId,
      input.senderId,
      input.body ?? null,
    ],
  );

  if (inserted.rowCount) {
    await client.query(
      `update public.conversations set updated_at = now() where id = $1`,
      [conversationId],
    );

    return {
      messageId: String(inserted.rows[0]!.id),
      conversationId: String(inserted.rows[0]!.conversation_id),
    };
  }

  return getExistingMessageByExternalId(
    client,
    companyId,
    input.channel,
    input.externalMessageId,
  );
}

export async function ingestInboundMessage(
  input: IngestInboundMessageInput,
): Promise<IngestInboundMessageResult> {
  return withTransaction(async (client) => {
    const company = await getCompanyByPlatformAccountId(
      client,
      input.channel,
      input.companyPlatformId,
    );

    const { customerId, companyCustomerId } = await resolveCustomerForCompany(
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
      conversationId = await createConversation(client, company.id, {
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
      customerId,
      companyId: company.id,
      companyName: company.name,
      conversationId: message.conversationId,
      messageId: message.messageId,
    };
  });
}
