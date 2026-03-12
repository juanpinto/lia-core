import type { PoolClient } from 'pg';
import { pool, withTransaction } from '../../db/index.js';
import { NotFoundError } from '../../lib/errors.js';
import type { z } from 'zod';
import type {
  CancelAppointmentBodySchema,
  CreateAppointmentBodySchema,
  RescheduleAppointmentBodySchema,
} from './schemas.js';

type CreateAppointmentInput = z.infer<typeof CreateAppointmentBodySchema>;
type CancelAppointmentInput = z.infer<typeof CancelAppointmentBodySchema>;
type RescheduleAppointmentInput = z.infer<typeof RescheduleAppointmentBodySchema>;

export interface AppointmentItemRecord {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number | null;
  durationMinutes: number | null;
  sortOrder: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AppointmentRecord {
  id: string;
  companyId: string;
  companyCustomerId: string;
  conversationId: string | null;
  rescheduledFromAppointmentId: string | null;
  startAtUtc: string;
  endAtUtc: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'no_show';
  createdVia: 'whatsapp' | 'instagram' | 'web' | 'manual';
  notes: string | null;
  metadata: Record<string, unknown> | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: AppointmentItemRecord[];
}

export interface UpcomingAppointmentContextRecord {
  id: string;
  status: string;
  startAtUtc: string;
  endAtUtc: string;
  notes: string | null;
}

function mapAppointmentItem(row: Record<string, unknown>): AppointmentItemRecord {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    quantity: Number(row.quantity),
    unitPriceCents: (row.unit_price_cents as number | null) ?? null,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    sortOrder: Number(row.sort_order),
    notes: (row.notes as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

function mapUpcomingContextRow(
  row: Record<string, unknown>,
): UpcomingAppointmentContextRecord {
  return {
    id: String(row.id),
    status: String(row.status),
    startAtUtc: new Date(String(row.start_at_utc)).toISOString(),
    endAtUtc: new Date(String(row.end_at_utc)).toISOString(),
    notes: (row.notes as string | null) ?? null,
  };
}

function mapAppointment(row: Record<string, unknown>, items: AppointmentItemRecord[]): AppointmentRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyCustomerId: String(row.company_customer_id),
    conversationId: (row.conversation_id as string | null) ?? null,
    rescheduledFromAppointmentId: (row.rescheduled_from_appointment_id as string | null) ?? null,
    startAtUtc: new Date(String(row.start_at_utc)).toISOString(),
    endAtUtc: new Date(String(row.end_at_utc)).toISOString(),
    status: row.status as AppointmentRecord['status'],
    createdVia: row.created_via as AppointmentRecord['createdVia'],
    notes: (row.notes as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    cancelledAt: row.cancelled_at ? new Date(String(row.cancelled_at)).toISOString() : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    items,
  };
}

async function insertItems(client: PoolClient, appointmentId: string, items: CreateAppointmentInput['items']): Promise<void> {
  for (const item of items) {
    await client.query(
      `insert into public.appointment_products
        (appointment_id, product_id, quantity, unit_price_cents, duration_minutes, sort_order, notes, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        appointmentId,
        item.productId,
        item.quantity,
        item.unitPriceCents ?? null,
        item.durationMinutes ?? null,
        item.sortOrder,
        item.notes ?? null,
        item.metadata ?? null,
      ],
    );
  }
}

async function getItems(client: PoolClient | typeof pool, appointmentId: string): Promise<AppointmentItemRecord[]> {
  const result = await client.query(
    `select id, product_id, quantity, unit_price_cents, duration_minutes, sort_order, notes, metadata
     from public.appointment_products
     where appointment_id = $1
     order by sort_order asc, created_at asc`,
    [appointmentId],
  );
  return result.rows.map(mapAppointmentItem);
}

export async function createAppointment(companyId: string, input: CreateAppointmentInput): Promise<AppointmentRecord> {
  return withTransaction(async (client) => {
    const appointmentResult = await client.query(
      `insert into public.appointments
        (company_id, company_customer_id, conversation_id, start_at_utc, end_at_utc, created_via, notes, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        companyId,
        input.companyCustomerId,
        input.conversationId ?? null,
        input.startAtUtc,
        input.endAtUtc,
        input.createdVia,
        input.notes ?? null,
        input.metadata ?? null,
      ],
    );

    const row = appointmentResult.rows[0]!;
    const appointmentId = String(row.id);
    await insertItems(client, appointmentId, input.items);
    const items = await getItems(client, appointmentId);
    return mapAppointment(row, items);
  });
}

export async function getAppointment(companyId: string, appointmentId: string): Promise<AppointmentRecord | null> {
  const result = await pool.query(`select * from public.appointments where company_id = $1 and id = $2`, [companyId, appointmentId]);
  if (!result.rowCount) {
    return null;
  }
  const items = await getItems(pool, appointmentId);
  return mapAppointment(result.rows[0]!, items);
}

export async function listAppointmentsForCompanyCustomer(companyId: string, companyCustomerId: string): Promise<AppointmentRecord[]> {
  const result = await pool.query(
    `select *
     from public.appointments
     where company_id = $1 and company_customer_id = $2
     order by start_at_utc desc`,
    [companyId, companyCustomerId],
  );

  const appointments: AppointmentRecord[] = [];
  for (const row of result.rows) {
    const items = await getItems(pool, String(row.id));
    appointments.push(mapAppointment(row, items));
  }
  return appointments;
}

export async function listUpcomingAppointmentsForCompanyCustomer(
  companyId: string,
  companyCustomerId: string,
  limit = 10,
): Promise<UpcomingAppointmentContextRecord[]> {
  const result = await pool.query(
    `select id, status, start_at_utc, end_at_utc, notes
     from public.appointments
     where company_id = $1
       and company_customer_id = $2
       and start_at_utc >= now()
     order by start_at_utc desc
     limit $3`,
    [companyId, companyCustomerId, limit],
  );

  return result.rows.map(mapUpcomingContextRow);
}

export async function cancelAppointment(companyId: string, appointmentId: string, input: CancelAppointmentInput): Promise<AppointmentRecord> {
  const result = await pool.query(
    `update public.appointments
     set status = 'cancelled', cancelled_at = now(), notes = coalesce($3, notes)
     where company_id = $1 and id = $2 and status = 'scheduled'
     returning *`,
    [companyId, appointmentId, input.reason ?? null],
  );
  if (!result.rowCount) {
    throw new NotFoundError(`Scheduled appointment ${appointmentId} was not found for company ${companyId}.`);
  }
  const items = await getItems(pool, appointmentId);
  return mapAppointment(result.rows[0]!, items);
}

export async function rescheduleAppointment(companyId: string, appointmentId: string, input: RescheduleAppointmentInput): Promise<AppointmentRecord> {
  return withTransaction(async (client) => {
    const existingResult = await client.query(
      `select * from public.appointments where company_id = $1 and id = $2 for update`,
      [companyId, appointmentId],
    );
    if (!existingResult.rowCount) {
      throw new NotFoundError(`Appointment ${appointmentId} was not found for company ${companyId}.`);
    }

    const existing = existingResult.rows[0]!;
    const items = await getItems(client, appointmentId);

    await client.query(
      `update public.appointments
       set status = 'cancelled', cancelled_at = now()
       where id = $1`,
      [appointmentId],
    );

    const created = await client.query(
      `insert into public.appointments
        (company_id, company_customer_id, conversation_id, rescheduled_from_appointment_id, start_at_utc, end_at_utc, created_via, notes, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [
        companyId,
        existing.company_customer_id,
        existing.conversation_id,
        appointmentId,
        input.startAtUtc,
        input.endAtUtc,
        input.createdVia,
        input.notes ?? existing.notes ?? null,
        input.metadata ?? existing.metadata ?? null,
      ],
    );

    const newAppointmentId = String(created.rows[0]!.id);
    await insertItems(
      client,
      newAppointmentId,
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        durationMinutes: item.durationMinutes,
        sortOrder: item.sortOrder,
        notes: item.notes,
        metadata: item.metadata,
      })),
    );

    const newItems = await getItems(client, newAppointmentId);
    return mapAppointment(created.rows[0]!, newItems);
  });
}
