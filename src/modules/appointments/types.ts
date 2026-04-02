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
  startAt: string;
  createdVia: AppointmentCreatedVia;
  notes?: string | null | undefined;
  items: AppointmentItemInput[];
}

export interface CreateAppointmentRepositoryInput {
  companyCustomerId: string;
  conversationId: string | null;
  startAt: string;
  endAt: string;
  createdVia: AppointmentCreatedVia;
  notes: string | null;
  items: AppointmentItemInput[];
}

export interface RescheduleAppointmentServiceInput {
  startAt: string;
  endAt?: string | undefined;
  createdVia: AppointmentCreatedVia;
  notes?: string | null | undefined;
}

export interface RescheduleAppointmentRepositoryInput {
  startAt: string;
  endAt: string;
  createdVia: AppointmentCreatedVia;
  notes?: string | null | undefined;
}
