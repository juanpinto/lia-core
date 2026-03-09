import { NotFoundError } from '../../lib/errors.js';
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  listAppointmentsForCompanyCustomer,
  rescheduleAppointment,
} from './repository.js';
import type { z } from 'zod';
import type {
  CancelAppointmentBodySchema,
  CreateAppointmentBodySchema,
  RescheduleAppointmentBodySchema,
} from './schemas.js';

type CreateAppointmentInput = z.infer<typeof CreateAppointmentBodySchema>;
type CancelAppointmentInput = z.infer<typeof CancelAppointmentBodySchema>;
type RescheduleAppointmentInput = z.infer<typeof RescheduleAppointmentBodySchema>;

export async function createAppointmentService(companyId: string, input: CreateAppointmentInput) {
  return createAppointment(companyId, input);
}

export async function getAppointmentOrThrow(companyId: string, appointmentId: string) {
  const appointment = await getAppointment(companyId, appointmentId);
  if (!appointment) {
    throw new NotFoundError(`Appointment ${appointmentId} was not found for company ${companyId}.`);
  }
  return appointment;
}

export async function listCompanyCustomerAppointmentsService(companyId: string, companyCustomerId: string) {
  return listAppointmentsForCompanyCustomer(companyId, companyCustomerId);
}

export async function cancelAppointmentService(companyId: string, appointmentId: string, input: CancelAppointmentInput) {
  return cancelAppointment(companyId, appointmentId, input);
}

export async function rescheduleAppointmentService(companyId: string, appointmentId: string, input: RescheduleAppointmentInput) {
  return rescheduleAppointment(companyId, appointmentId, input);
}
