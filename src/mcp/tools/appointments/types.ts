import { z } from "zod";

export const AppointmentItemInputSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().default(1),
  unitPriceCents: z.number().int().min(0).nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const AppointmentItemSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  sortOrder: z.number().int(),
  notes: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export const AppointmentSchema = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  conversationId: z.uuid().nullable(),
  rescheduledFromAppointmentId: z.uuid().nullable(),
  startAtUtc: z.iso.datetime({ offset: true }),
  status: z.enum(["scheduled", "cancelled", "completed", "no_show"]),
  createdVia: z.enum(["whatsapp", "instagram", "web", "manual"]),
  notes: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  cancelledAt: z.iso.datetime({ offset: true }).nullable(),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  items: z.array(AppointmentItemSchema),
});

export const CustomerAppointmentSchema = z.object({
  id: z.uuid(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  status: z.enum(["scheduled", "cancelled", "completed", "no_show"]),
});

export const AppointmentOutputSchema = z.object({
  appointment: AppointmentSchema,
});

export const AppointmentsOutputSchema = z.object({
  appointments: z.array(AppointmentSchema),
});

export const CustomerAppointmentOutputSchema = z.object({
  appointment: CustomerAppointmentSchema,
});

export const CustomerAppointmentsOutputSchema = z.object({
  appointments: z.array(CustomerAppointmentSchema),
});
