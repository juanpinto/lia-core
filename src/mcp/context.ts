import { resolveCompanyCustomerService } from "../modules/customers/service.js";
import { searchCompanyProducts } from "../modules/products/service.js";
import { getConversationContext } from "../modules/conversations/service.js";
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
  conversations: {
    getConversationContext: typeof getConversationContext;
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
    conversations: {
      getConversationContext: getConversationContext,
    },
    appointments: {
      createAppointment: createAppointmentService,
      listCompanyCustomerAppointments: listCompanyCustomerAppointmentsService,
      cancelAppointment: cancelAppointmentService,
      rescheduleAppointment: rescheduleAppointmentService,
    },
  };
}
