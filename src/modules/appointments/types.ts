export type AppointmentCreatedVia =
  | "whatsapp"
  | "instagram"
  | "web"
  | "manual";

export interface AppointmentItemInput {
  productId: string;
  quantity: number;
  notes?: string | null | undefined;
}

export interface CreateAppointmentForCustomerInput {
  customerId: string;
  conversationId?: string | null;
  startAtUtc: string;
  createdVia: AppointmentCreatedVia;
  notes?: string | null | undefined;
  items: AppointmentItemInput[];
}

export interface CreateAppointmentRepositoryInput {
  companyCustomerId: string;
  conversationId: string | null;
  startAtUtc: string;
  endAtUtc: string;
  createdVia: AppointmentCreatedVia;
  notes: string | null;
  items: AppointmentItemInput[];
}

export interface RescheduleAppointmentServiceInput {
  startAtUtc: string;
  endAtUtc?: string | undefined;
  createdVia: AppointmentCreatedVia;
  notes?: string | null | undefined;
}

export interface RescheduleAppointmentRepositoryInput {
  startAtUtc: string;
  endAtUtc: string;
  createdVia: AppointmentCreatedVia;
  notes?: string | null | undefined;
}
