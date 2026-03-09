import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import {
  cancelAppointmentService,
  createAppointmentService,
  getAppointmentOrThrow,
  listCompanyCustomerAppointmentsService,
  rescheduleAppointmentService,
} from './service.js';
import {
  AppointmentParamsSchema,
  CancelAppointmentBodySchema,
  CompanyCustomerAppointmentsParamsSchema,
  CompanyParamsSchema,
  CreateAppointmentBodySchema,
  RescheduleAppointmentBodySchema,
} from './schemas.js';

export const appointmentsRouter = Router({ mergeParams: true });

appointmentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: CreateAppointmentBodySchema });
    const appointment = await createAppointmentService(params.companyId, body);
    ok(res, appointment, 201);
  }),
);

appointmentsRouter.get(
  '/:appointmentId',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: AppointmentParamsSchema });
    const appointment = await getAppointmentOrThrow(params.companyId, params.appointmentId);
    ok(res, appointment);
  }),
);

appointmentsRouter.get(
  '/company-customers/:companyCustomerId',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CompanyCustomerAppointmentsParamsSchema });
    const appointments = await listCompanyCustomerAppointmentsService(params.companyId, params.companyCustomerId);
    ok(res, appointments);
  }),
);

appointmentsRouter.post(
  '/:appointmentId/cancel',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: AppointmentParamsSchema, body: CancelAppointmentBodySchema });
    const appointment = await cancelAppointmentService(params.companyId, params.appointmentId, body);
    ok(res, appointment);
  }),
);

appointmentsRouter.post(
  '/:appointmentId/reschedule',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: AppointmentParamsSchema, body: RescheduleAppointmentBodySchema });
    const appointment = await rescheduleAppointmentService(params.companyId, params.appointmentId, body);
    ok(res, appointment);
  }),
);
