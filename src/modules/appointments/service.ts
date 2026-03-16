import { NotFoundError, ValidationError } from "../../lib/errors.js";
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  listAppointmentsForCustomer,
  listAppointmentsForCompanyCustomer,
  rescheduleAppointment,
} from "./repository.js";
import { getCompanyCustomerIdForCustomerOrThrow } from "../customers/service.js";
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

export async function createAppointmentForCustomerService(
  companyId: string,
  input: CreateCustomerAppointmentInput,
) {
  const startAt = new Date(input.startAtUtc);
  if (Number.isNaN(startAt.getTime())) {
    throw new ValidationError(`Invalid startAtUtc value: ${input.startAtUtc}.`);
  }

  const companyCustomerId = await getCompanyCustomerIdForCustomerOrThrow(
    companyId,
    input.customerId,
  );

  return createAppointment(companyId, companyCustomerId, {
    customerId: input.customerId,
    conversationId: input.conversationId,
    startAtUtc: startAt.toISOString(),
    endAtUtc: new Date(startAt.getTime() + 60 * 60 * 1000).toISOString(),
    createdVia: input.createdVia,
    notes: input.notes ?? null,
    metadata: input.metadata ?? null,
  });
}

export async function getAppointmentOrThrow(
  companyId: string,
  appointmentId: string,
) {
  const appointment = await getAppointment(companyId, appointmentId);
  if (!appointment) {
    throw new NotFoundError(
      `Appointment ${appointmentId} was not found for company ${companyId}.`,
    );
  }
  return appointment;
}

export async function listCompanyCustomerAppointmentsService(
  companyId: string,
  companyCustomerId: string,
) {
  return listAppointmentsForCompanyCustomer(companyId, companyCustomerId);
}

export async function listCustomerAppointmentsService(customerId: string) {
  return listAppointmentsForCustomer(customerId);
}

export async function cancelAppointmentService(
  companyId: string,
  appointmentId: string,
  input: CancelAppointmentInput,
) {
  return cancelAppointment(companyId, appointmentId, input);
}

export async function rescheduleAppointmentService(
  companyId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput,
) {
  return rescheduleAppointment(companyId, appointmentId, input);
}
