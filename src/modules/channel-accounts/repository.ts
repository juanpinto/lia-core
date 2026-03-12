import type { PoolClient } from "pg";
import { pool } from "../../db/index.js";
import type { CreateChannelAccountBody } from "./schemas.js";

export interface ChannelAccountRecord {
  id: string;
  companyId: string;
  channel: "whatsapp" | "instagram" | "web" | "manual";
  externalAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyByPlatformAccountRecord {
  id: string;
  name: string;
  channelAccountId: string;
}

function mapRow(row: Record<string, unknown>): ChannelAccountRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    channel: row.channel as ChannelAccountRecord["channel"],
    externalAccountId: String(row.platform_account_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function findCompanyByPlatformAccountId(
  client: PoolClient,
  channel: ChannelAccountRecord["channel"],
  platformAccountId: string,
): Promise<CompanyByPlatformAccountRecord | null> {
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
    return null;
  }

  return {
    id: String(result.rows[0]!.company_id),
    name: String(result.rows[0]!.company_name),
    channelAccountId: String(result.rows[0]!.channel_account_id),
  };
}

export async function insertChannelAccount(
  companyId: string,
  input: CreateChannelAccountBody,
): Promise<ChannelAccountRecord> {
  const result = await pool.query(
    `insert into public.channel_accounts
      (company_id, channel, platform_account_id)
     values ($1, $2, $3)
     returning id, company_id, channel, platform_account_id, created_at, updated_at`,
    [companyId, input.channel, input.externalAccountId],
  );
  return mapRow(result.rows[0]!);
}

export async function listChannelAccounts(
  companyId: string,
): Promise<ChannelAccountRecord[]> {
  const result = await pool.query(
    `select id, company_id, channel, platform_account_id, created_at, updated_at
     from public.channel_accounts
     where company_id = $1
     order by created_at asc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}
