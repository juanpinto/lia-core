import { resolveCompanyCustomerService } from "../modules/customers/service.js";
import { searchCompanyProducts } from "../modules/products/service.js";
import { getConversationContextForBrain } from "../modules/conversations/service.js";
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
    getConversationContext: typeof getConversationContextForBrain;
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
      getConversationContext: getConversationContextForBrain,
    },
    appointments: {
      createAppointment: createAppointmentService,
      listCompanyCustomerAppointments: listCompanyCustomerAppointmentsService,
      cancelAppointment: cancelAppointmentService,
      rescheduleAppointment: rescheduleAppointmentService,
    },
  };
}
