import type { PoolClient } from "pg";
import { pool } from "../../db/index.js";

export interface ConversationRecord {
  id: string;
  companyId: string;
  companyCustomerId: string;
  channelAccountId: string | null;
  channel: string;
  status: "open" | "closed";
  metadata: Record<string, unknown> | null;
  summary: string | null;
  startedAt: string;
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

export interface ConversationContextBaseRecord {
  conversationId: string;
  companyId: string;
  companyCustomerId: string;
  companyName: string;
  companyTimezone: string;
  companyPlatformAccountId: string | null;
  customerId: string;
  customerName: string | null;
  customerChannel: "whatsapp" | "instagram" | "web" | "manual";
  customerPlatformAccountId: string;
  startedAt: string;
  updatedAt: string;
}

export interface ConversationContextMessageRecord {
  id: string;
  direction: "inbound" | "outbound";
  role: "user" | "assistant" | "system" | "tool" | null;
  body: string | null;
  createdAt: string;
}

export interface MessageWriteRecord {
  messageId: string;
  conversationId: string;
  created: boolean;
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
    startedAt: new Date(String(row.started_at)).toISOString(),
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

function mapConversationContextMessageRow(
  row: Record<string, unknown>,
): ConversationContextMessageRecord {
  return {
    id: String(row.id),
    direction: row.direction as ConversationContextMessageRecord["direction"],
    role: (row.role as ConversationContextMessageRecord["role"]) ?? null,
    body: (row.body as string | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getConversationContextBase(
  companyId: string,
  conversationId: string,
): Promise<ConversationContextBaseRecord | null> {
  const result = await pool.query(
    `
    select
      c.id as conversation_id,
      c.company_id,
      c.company_customer_id,
      c.started_at,
      c.updated_at,
      co.name as company_name,
      co.timezone as company_timezone,
      ca.platform_account_id as company_platform_account_id,
      cu.id as customer_id,
      cu.name as customer_name,
      cu.channel as customer_channel,
      cu.platform_user_id as customer_platform_account_id
    from public.conversations c
    inner join public.companies co
      on co.id = c.company_id
    inner join public.company_customers cc
      on cc.id = c.company_customer_id
    inner join public.customers cu
      on cu.id = cc.customer_id
    left join public.channel_accounts ca
      on ca.id = c.channel_account_id
    where c.company_id = $1
      and c.id = $2
    limit 1
    `,
    [companyId, conversationId],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0]!;
  return {
    conversationId: String(row.conversation_id),
    companyId: String(row.company_id),
    companyCustomerId: String(row.company_customer_id),
    companyName: String(row.company_name),
    companyTimezone: String(row.company_timezone),
    companyPlatformAccountId:
      (row.company_platform_account_id as string | null) ?? null,
    customerId: String(row.customer_id),
    customerName: (row.customer_name as string | null) ?? null,
    customerChannel:
      row.customer_channel as ConversationContextBaseRecord["customerChannel"],
    customerPlatformAccountId: String(row.customer_platform_account_id),
    startedAt: new Date(String(row.started_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function getConversation(
  companyId: string,
  conversationId: string,
): Promise<ConversationRecord | null> {
  const result = await pool.query(
    `
    select *
    from public.conversations
    where company_id = $1
      and id = $2
    limit 1
    `,
    [companyId, conversationId],
  );

  return result.rowCount ? mapConversationRow(result.rows[0]!) : null;
}

export async function listRecentConversationContextMessages(
  companyId: string,
  conversationId: string,
  limit = 10,
): Promise<ConversationContextMessageRecord[]> {
  const result = await pool.query(
    `
    select id, direction, role, body, created_at
    from public.messages
    where company_id = $1
      and conversation_id = $2
    order by created_at desc
    limit $3
    `,
    [companyId, conversationId, limit],
  );

  return result.rows.map(mapConversationContextMessageRow);
}

export async function findReusableConversation(
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

export async function createConversationForInbound(
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
): Promise<MessageWriteRecord> {
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
    created: false,
  };
}

export async function insertInboundMessage(
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
): Promise<MessageWriteRecord> {
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
      created: true,
    };
  }

  return getExistingMessageByExternalId(
    client,
    companyId,
    input.channel,
    input.externalMessageId,
  );
}

export async function insertOutboundMessage(
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
): Promise<MessageWriteRecord> {
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
    values ($1, $2, $3, $4, $5, 'outbound', $6, $7, 'assistant')
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
      created: true,
    };
  }

  return getExistingMessageByExternalId(
    client,
    companyId,
    input.channel,
    input.externalMessageId,
  );
}

export async function appendConversationSummaryPatch(
  client: PoolClient,
  companyId: string,
  conversationId: string,
  summaryPatch: string,
): Promise<void> {
  await client.query(
    `
    update public.conversations
    set
      summary = case
        when summary is null or btrim(summary) = '' then $3
        else summary || E'\n\n' || $3
      end,
      updated_at = now()
    where company_id = $1
      and id = $2
    `,
    [companyId, conversationId, summaryPatch],
  );
}
