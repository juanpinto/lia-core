import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/http.js";
import { validateRequest } from "../../lib/validate.js";
import {
  cancelAppointmentService,
  getAppointmentOrThrow,
  listCompanyAppointmentsService,
  listCompanyCustomerAppointmentsService,
  rescheduleAppointmentService,
} from "./service.js";
import {
  AppointmentParamsSchema,
  CancelAppointmentBodySchema,
  CompanyCustomerAppointmentsParamsSchema,
  CompanyParamsSchema,
  RescheduleAppointmentBodySchema,
} from "./schemas.js";
import { z } from "zod";

const ListAppointmentsQuerySchema = z.object({
  status: z.enum(["scheduled", "cancelled", "completed", "no_show"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const appointmentsRouter = Router({ mergeParams: true });

appointmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { params, query } = validateRequest(req, {
      params: CompanyParamsSchema,
      query: ListAppointmentsQuerySchema,
    });
    const appointments = await listCompanyAppointmentsService(params.companyId, query);
    ok(res, appointments);
  }),
);

appointmentsRouter.get(
  "/:appointmentId",
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, {
      params: AppointmentParamsSchema,
    });
    const appointment = await getAppointmentOrThrow(
      params.companyId,
      params.appointmentId,
    );
    ok(res, appointment);
  }),
);

appointmentsRouter.get(
  "/company-customers/:companyCustomerId",
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, {
      params: CompanyCustomerAppointmentsParamsSchema,
    });
    const appointments = await listCompanyCustomerAppointmentsService(
      params.companyId,
      params.companyCustomerId,
    );
    ok(res, appointments);
  }),
);

appointmentsRouter.post(
  "/:appointmentId/cancel",
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, {
      params: AppointmentParamsSchema,
      body: CancelAppointmentBodySchema,
    });
    const appointment = await cancelAppointmentService(
      params.companyId,
      params.appointmentId,
    );
    ok(res, appointment);
  }),
);

appointmentsRouter.post(
  "/:appointmentId/reschedule",
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, {
      params: AppointmentParamsSchema,
      body: RescheduleAppointmentBodySchema,
    });
    const appointment = await rescheduleAppointmentService(
      params.companyId,
      params.appointmentId,
      {
        startAtLocal: body.startAtUtc,
        createdVia: body.createdVia,
        notes: body.notes,
      },
    );
    ok(res, appointment);
  }),
);
