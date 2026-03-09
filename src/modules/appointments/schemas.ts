import { z } from 'zod';

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });
export const AppointmentParamsSchema = z.object({ companyId: z.uuid(), appointmentId: z.uuid() });
export const CompanyCustomerAppointmentsParamsSchema = z.object({ companyId: z.uuid(), companyCustomerId: z.uuid() });

const AppointmentProductInputSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().default(1),
  unitPriceCents: z.number().int().min(0).nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const CreateAppointmentBodySchema = z.object({
  companyCustomerId: z.uuid(),
  conversationId: z.uuid().nullable().optional(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  createdVia: z.enum(['whatsapp', 'instagram', 'web', 'manual']).default('whatsapp'),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  items: z.array(AppointmentProductInputSchema).min(1),
});

export const CancelAppointmentBodySchema = z.object({
  reason: z.string().trim().min(1).nullable().optional(),
});

export const RescheduleAppointmentBodySchema = z.object({
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  createdVia: z.enum(['whatsapp', 'instagram', 'web', 'manual']).default('manual'),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});
