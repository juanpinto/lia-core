import type { PoolClient } from "pg";
import { pool, withTransaction } from "../../db/index.js";
import { NotFoundError } from "../../lib/errors.js";
import type { z } from "zod";
import type {
  CancelAppointmentBodySchema,
  CreateAppointmentBodySchema,
  RescheduleAppointmentBodySchema,
  CreateCustomerAppointmentInput,
} from "./schemas.js";

type CreateAppointmentInput = z.infer<typeof CreateAppointmentBodySchema>;
type CancelAppointmentInput = z.infer<typeof CancelAppointmentBodySchema>;
type RescheduleAppointmentInput = z.infer<
  typeof RescheduleAppointmentBodySchema
>;

export interface AppointmentItemRecord {
  id: string;
  productId: string;
  quantity: number;
  notes: string | null;
}

export interface AppointmentRecord {
  id: string;
  companyId: string;
  companyCustomerId: string;
  conversationId: string | null;
  startAtUtc: string;
  endAtUtc: string;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
  createdVia: "whatsapp" | "instagram" | "web" | "manual";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: AppointmentItemRecord[];
}

export interface CustomerAppointmentRecord {
  id: string;
  startAtUtc: string;
  endAtUtc: string;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
}

export interface UpcomingAppointmentContextRecord {
  id: string;
  status: string;
  startAtUtc: string;
  endAtUtc: string;
  notes: string | null;
}

function mapAppointmentItem(
  row: Record<string, unknown>,
): AppointmentItemRecord {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    quantity: Number(row.quantity),
    notes: (row.notes as string | null) ?? null,
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

function mapAppointment(
  row: Record<string, unknown>,
  items: AppointmentItemRecord[],
): AppointmentRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyCustomerId: String(row.company_customer_id),
    conversationId: (row.conversation_id as string | null) ?? null,
    startAtUtc: new Date(String(row.start_at_utc)).toISOString(),
    endAtUtc: new Date(String(row.end_at_utc)).toISOString(),
    status: row.status as AppointmentRecord["status"],
    createdVia: row.created_via as AppointmentRecord["createdVia"],
    notes: (row.notes as string | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    items,
  };
}

function mapCustomerAppointment(
  row: Record<string, unknown>,
): CustomerAppointmentRecord {
  return {
    id: String(row.id),
    startAtUtc: new Date(String(row.start_at_utc)).toISOString(),
    endAtUtc: new Date(String(row.end_at_utc)).toISOString(),
    status: row.status as AppointmentRecord["status"],
  };
}

async function insertItems(
  client: PoolClient,
  appointmentId: string,
  items: CreateAppointmentInput["items"],
): Promise<void> {
  for (const item of items) {
    await client.query(
      `insert into public.appointment_products
        (appointment_id, product_id, quantity, notes)
       values ($1, $2, $3, $4)`,
      [
        appointmentId,
        item.productId,
        item.quantity,
        item.notes ?? null,
      ],
    );
  }
}

async function getItems(
  client: PoolClient | typeof pool,
  appointmentId: string,
): Promise<AppointmentItemRecord[]> {
  const result = await client.query(
    `select id, product_id, quantity, notes
     from public.appointment_products
     where appointment_id = $1
     order by created_at asc`,
    [appointmentId],
  );
  return result.rows.map(mapAppointmentItem);
}

export async function createAppointment(
  companyId: string,
  customerCompanyId: string,
  input: CreateCustomerAppointmentInput,
): Promise<AppointmentRecord> {
  return withTransaction(async (client) => {
    const appointmentResult = await client.query(
      `insert into public.appointments
        (company_id, company_customer_id, conversation_id, start_at_utc, end_at_utc, created_via, notes)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        companyId,
        customerCompanyId,
        input.conversationId ?? null,
        input.startAtUtc,
        input.endAtUtc,
        input.createdVia,
        input.notes ?? null,
      ],
    );

    const row = appointmentResult.rows[0]!;
    const appointmentId = String(row.id);
    await insertItems(client, appointmentId, input.items);
    const items = await getItems(client, appointmentId);
    return mapAppointment(row, items);
  });
}

export async function createCustomerAppointment(
  companyId: string,
  input: CreateAppointmentInput,
): Promise<AppointmentRecord> {
  return withTransaction(async (client) => {
    const appointmentResult = await client.query(
      `insert into public.appointments
        (company_id, company_customer_id, conversation_id, start_at_utc, end_at_utc, created_via, notes)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        companyId,
        input.companyCustomerId,
        input.conversationId ?? null,
        input.startAtUtc,
        input.endAtUtc,
        input.createdVia,
        input.notes ?? null,
      ],
    );

    const row = appointmentResult.rows[0]!;
    const appointmentId = String(row.id);
    await insertItems(client, appointmentId, input.items);
    const items = await getItems(client, appointmentId);
    return mapAppointment(row, items);
  });
}

export async function getAppointment(
  companyId: string,
  appointmentId: string,
): Promise<AppointmentRecord | null> {
  const result = await pool.query(
    `select * from public.appointments where company_id = $1 and id = $2`,
    [companyId, appointmentId],
  );
  if (!result.rowCount) {
    return null;
  }
  const items = await getItems(pool, appointmentId);
  return mapAppointment(result.rows[0]!, items);
}

export async function listAppointmentsForCompanyCustomer(
  companyId: string,
  companyCustomerId: string,
): Promise<AppointmentRecord[]> {
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

export async function listAppointmentsForCustomer(
  customerId: string,
): Promise<AppointmentRecord[]> {
  const result = await pool.query(
    `select a.*
     from public.appointments a
     inner join public.company_customers cc
       on cc.id = a.company_customer_id
     where cc.customer_id = $1
     order by a.start_at_utc desc`,
    [customerId],
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

export async function cancelAppointment(
  companyId: string,
  appointmentId: string,
  input: CancelAppointmentInput,
): Promise<AppointmentRecord> {
  const result = await pool.query(
    `update public.appointments
     set status = 'cancelled', notes = coalesce($3, notes)
     where company_id = $1 and id = $2 and status = 'scheduled'
     returning *`,
    [companyId, appointmentId, input.reason ?? null],
  );
  if (!result.rowCount) {
    throw new NotFoundError(
      `Scheduled appointment ${appointmentId} was not found for company ${companyId}.`,
    );
  }
  const items = await getItems(pool, appointmentId);
  return mapAppointment(result.rows[0]!, items);
}

export async function rescheduleAppointment(
  companyId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput,
): Promise<AppointmentRecord> {
  const result = await pool.query(
    `update public.appointments
     set start_at_utc = $3,
         end_at_utc = $4,
         status = 'scheduled',
         created_via = $5,
         notes = coalesce($6, notes)
     where company_id = $1 and id = $2
     returning *`,
    [
      companyId,
      appointmentId,
      input.startAtUtc,
      input.endAtUtc,
      input.createdVia,
      input.notes ?? null,
    ],
  );

  if (!result.rowCount) {
    throw new NotFoundError(
      `Appointment ${appointmentId} was not found for company ${companyId}.`,
    );
  }

  const items = await getItems(pool, appointmentId);
  return mapAppointment(result.rows[0]!, items);
}
