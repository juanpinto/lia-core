import { NotFoundError, ValidationError } from "../../lib/errors.js";
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  listAppointmentsForCompany,
  listAppointmentsForCustomer,
  listAppointmentsForCompanyCustomer,
  rescheduleAppointment,
} from "./repository.js";
import { getConversation } from "../conversations/repository.js";
import { getCompanyCustomerIdForCustomerOrThrow } from "../customers/service.js";
import { assertCompanyProductsExist } from "../products/service.js";
import { findCompanyById } from "../companies/repository.js";
import type {
  CreateAppointmentForCustomerInput,
  RescheduleAppointmentServiceInput,
} from "./types.js";

const DEFAULT_APPOINTMENT_DURATION_MS = 60 * 60 * 1000;

export async function createAppointmentForCustomerService(
  companyId: string,
  input: CreateAppointmentForCustomerInput,
) {
  const company = await findCompanyById(companyId);
  if (!company) throw new NotFoundError(`Company ${companyId} not found.`);

  const companyCustomerId = await getCompanyCustomerIdForCustomerOrThrow(
    companyId,
    input.customerId,
  );

  if (input.conversationId) {
    const conversation = await getConversation(companyId, input.conversationId);
    if (!conversation) {
      throw new NotFoundError(
        `Conversation ${input.conversationId} was not found for company ${companyId}.`,
      );
    }
    if (conversation.companyCustomerId !== companyCustomerId) {
      throw new ValidationError(
        `Conversation ${input.conversationId} does not belong to customer ${input.customerId} for company ${companyId}.`,
      );
    }
  }

  await assertCompanyProductsExist(
    companyId,
    input.items.map((item) => item.productId),
  );

  const endAt = new Date(new Date(input.startAt + 'Z').getTime() + DEFAULT_APPOINTMENT_DURATION_MS)
    .toISOString();

  return createAppointment(companyId, {
    companyCustomerId,
    conversationId: input.conversationId ?? null,
    startAt: input.startAt,
    endAt,
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

export async function listCompanyAppointmentsService(
  companyId: string,
  filters: { status?: string | undefined; limit?: number | undefined; offset?: number | undefined } = {},
) {
  return listAppointmentsForCompany(companyId, filters);
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
  const company = await findCompanyById(companyId);
  if (!company) throw new NotFoundError(`Company ${companyId} not found.`);

  const endAt = new Date(new Date(input.startAt + 'Z').getTime() + DEFAULT_APPOINTMENT_DURATION_MS)
    .toISOString();

  return rescheduleAppointment(companyId, appointmentId, {
    startAt: input.startAt,
    endAt,
    createdVia: input.createdVia,
    notes: input.notes ?? null,
  });
}
