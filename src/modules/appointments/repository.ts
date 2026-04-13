import type { PoolClient } from "pg";
import { DateTime } from "luxon";
import { pool, withTransaction } from "../../db/index.js";
import { NotFoundError } from "../../lib/errors.js";
import type {
  AppointmentItemInput,
  CreateAppointmentRepositoryInput,
  RescheduleAppointmentRepositoryInput,
} from "./types.js";

export interface AppointmentItemRecord {
  id: string;
  productId: string;
  quantity: number;
  notes: string | null;
  productName: string;
  productPrice: number;
  productDurationMinutes: number;
}

export interface AppointmentRecord {
  id: string;
  companyId: string;
  companyCustomerId: string;
  conversationId: string | null;
  startAt: string;
  endAt: string;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
  createdVia: "whatsapp" | "instagram" | "web" | "manual";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: AppointmentItemRecord[];
  customer: {
    name: string | null;
    platformUserId: string;
  } | null;
}

export interface UpcomingAppointmentContextRecord {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
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
    productName: String(row.product_name ?? ""),
    productPrice: Number(row.product_price ?? 0),
    productDurationMinutes: Number(row.product_duration_minutes ?? 0),
  };
}

function mapUpcomingContextRow(
  row: Record<string, unknown>,
): UpcomingAppointmentContextRecord {
  return {
    id: String(row.id),
    status: String(row.status),
    startAt: DateTime.fromJSDate(row.start_at as Date).toFormat("yyyy-MM-dd'T'HH:mm:ss"),
    endAt: DateTime.fromJSDate(row.end_at as Date).toFormat("yyyy-MM-dd'T'HH:mm:ss"),
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
    startAt: DateTime.fromJSDate(row.start_at as Date).toFormat("yyyy-MM-dd'T'HH:mm:ss"),
    endAt: DateTime.fromJSDate(row.end_at as Date).toFormat("yyyy-MM-dd'T'HH:mm:ss"),
    status: row.status as AppointmentRecord["status"],
    createdVia: row.created_via as AppointmentRecord["createdVia"],
    notes: (row.notes as string | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    items,
    customer: row.customer_name !== undefined || row.customer_platform_user_id !== undefined
      ? {
          name: (row.customer_name as string | null) ?? null,
          platformUserId: String(row.customer_platform_user_id ?? ""),
        }
      : null,
  };
}

async function insertItems(
  client: PoolClient,
  companyId: string,
  appointmentId: string,
  items: AppointmentItemInput[],
): Promise<void> {
  for (const item of items) {
    await client.query(
      `insert into public.appointment_products
        (company_id, appointment_id, product_id, quantity, notes)
       values ($1, $2, $3, $4, $5)`,
      [companyId, appointmentId, item.productId, item.quantity, item.notes ?? null],
    );
  }
}

async function getItems(
  client: PoolClient | typeof pool,
  appointmentId: string,
): Promise<AppointmentItemRecord[]> {
  const result = await client.query(
    `select ap.id, ap.product_id, ap.quantity, ap.notes,
            p.name as product_name, p.price as product_price,
            p.duration_minutes as product_duration_minutes
     from public.appointment_products ap
     inner join public.products p on p.id = ap.product_id
     where ap.appointment_id = $1
     order by ap.created_at asc`,
    [appointmentId],
  );
  return result.rows.map(mapAppointmentItem);
}

export async function createAppointment(
  companyId: string,
  input: CreateAppointmentRepositoryInput,
): Promise<AppointmentRecord> {
  return withTransaction(async (client) => {
    const appointmentResult = await client.query(
      `insert into public.appointments
        (company_id, company_customer_id, conversation_id, start_at, end_at, created_via, notes)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        companyId,
        input.companyCustomerId,
        input.conversationId,
        input.startAt,
        input.endAt,
        input.createdVia,
        input.notes ?? null,
      ],
    );

    const row = appointmentResult.rows[0]!;
    const appointmentId = String(row.id);
    await insertItems(client, companyId, appointmentId, input.items);
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

export async function listAppointmentsForCompany(
  companyId: string,
  filters: { status?: string | undefined; limit?: number | undefined; offset?: number | undefined } = {},
): Promise<AppointmentRecord[]> {
  const { status, limit = 50, offset = 0 } = filters;
  const result = await pool.query(
    `select a.*,
            cu.name as customer_name,
            cu.platform_user_id as customer_platform_user_id
     from public.appointments a
     inner join public.company_customers cc on cc.id = a.company_customer_id
     inner join public.customers cu on cu.id = cc.customer_id
     where a.company_id = $1
       and ($2::text is null or a.status = $2)
     order by a.start_at desc
     limit $3 offset $4`,
    [companyId, status ?? null, limit, offset],
  );

  const appointments: AppointmentRecord[] = [];
  for (const row of result.rows) {
    const items = await getItems(pool, String(row.id));
    appointments.push(mapAppointment(row, items));
  }
  return appointments;
}

export async function listAppointmentsForCompanyCustomer(
  companyId: string,
  companyCustomerId: string,
): Promise<AppointmentRecord[]> {
  const result = await pool.query(
    `select *
     from public.appointments
     where company_id = $1 and company_customer_id = $2
     order by start_at desc`,
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
       and a.status = 'scheduled'
     order by a.start_at desc`,
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
    `select id, status, start_at, end_at, notes
     from public.appointments
     where company_id = $1
       and company_customer_id = $2
       and status = 'scheduled'
       and start_at >= now()
     order by start_at desc
     limit $3`,
    [companyId, companyCustomerId, limit],
  );

  return result.rows.map(mapUpcomingContextRow);
}

export async function cancelAppointment(
  companyId: string,
  appointmentId: string,
): Promise<AppointmentRecord> {
  const result = await pool.query(
    `update public.appointments
     set status = 'cancelled'
     where company_id = $1 and id = $2 and status = 'scheduled'
     returning *`,
    [companyId, appointmentId],
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
  input: RescheduleAppointmentRepositoryInput,
): Promise<AppointmentRecord> {
  const result = await pool.query(
    `update public.appointments
     set start_at = $3,
         end_at = $4,
         status = 'scheduled',
         created_via = $5,
         notes = coalesce($6, notes)
     where company_id = $1 and id = $2
     returning *`,
    [
      companyId,
      appointmentId,
      input.startAt,
      input.endAt,
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
