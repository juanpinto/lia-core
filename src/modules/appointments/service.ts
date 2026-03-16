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
import type {
  CreateAppointmentForCustomerInput,
  RescheduleAppointmentServiceInput,
} from "./types.js";

const DEFAULT_APPOINTMENT_DURATION_MS = 60 * 60 * 1000;

function parseDateOrThrow(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${fieldName} value: ${value}.`);
  }
  return date;
}

export async function createAppointmentForCustomerService(
  companyId: string,
  input: CreateAppointmentForCustomerInput,
) {
  const startAt = parseDateOrThrow(input.startAtUtc, "startAtUtc");

  const companyCustomerId = await getCompanyCustomerIdForCustomerOrThrow(
    companyId,
    input.customerId,
  );

  return createAppointment(companyId, {
    companyCustomerId,
    conversationId: input.conversationId ?? null,
    startAtUtc: startAt.toISOString(),
    endAtUtc: new Date(startAt.getTime() + 60 * 60 * 1000).toISOString(),
    createdVia: input.createdVia,
    notes: input.notes ?? null,
    items: input.items,
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
) {
  return cancelAppointment(companyId, appointmentId);
}

export async function rescheduleAppointmentService(
  companyId: string,
  appointmentId: string,
  input: RescheduleAppointmentServiceInput,
) {
  const startAt = parseDateOrThrow(input.startAtUtc, "startAtUtc");

  return rescheduleAppointment(companyId, appointmentId, {
    startAtUtc: startAt.toISOString(),
    endAtUtc: new Date(startAt.getTime() + 60 * 60 * 1000).toISOString(),
    createdVia: input.createdVia,
    notes: input.notes ?? null,
  });
}
