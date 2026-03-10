import { resolveCompanyCustomerService } from "../modules/customers/service.js";
import { searchCompanyProducts } from "../modules/products/service.js";
import {
  cancelAppointmentService,
  createAppointmentService,
  listCompanyCustomerAppointmentsService,
  rescheduleAppointmentService,
} from "../modules/appointments/service.js";

export type McpContext = {
  customers: {
    resolveCompanyCustomer: typeof resolveCompanyCustomerService;
  };
  products: {
    searchCompanyProducts: typeof searchCompanyProducts;
  };
  appointments: {
    createAppointment: typeof createAppointmentService;
    listCompanyCustomerAppointments: typeof listCompanyCustomerAppointmentsService;
    cancelAppointment: typeof cancelAppointmentService;
    rescheduleAppointment: typeof rescheduleAppointmentService;
  };
};

export function createMcpContext(): McpContext {
  return {
    customers: {
      resolveCompanyCustomer: resolveCompanyCustomerService,
    },
    products: {
      searchCompanyProducts,
    },
    appointments: {
      createAppointment: createAppointmentService,
      listCompanyCustomerAppointments: listCompanyCustomerAppointmentsService,
      cancelAppointment: cancelAppointmentService,
      rescheduleAppointment: rescheduleAppointmentService,
    },
  };
}
