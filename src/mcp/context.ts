import { resolveCompanyCustomerService } from "../modules/customers/service.js";
import {
  listActiveCompanyProducts,
  searchCompanyProducts,
} from "../modules/products/service.js";
import { getConversationContext } from "../modules/conversations/service.js";
import {
  cancelAppointmentService,
  createAppointmentForCustomerService,
  listCustomerAppointmentsService,
  rescheduleAppointmentService,
} from "../modules/appointments/service.js";

export type McpContext = {
  customers: {
    resolveCompanyCustomer: typeof resolveCompanyCustomerService;
  };
  products: {
    listActiveProducts: typeof listActiveCompanyProducts;
    searchCompanyProducts: typeof searchCompanyProducts;
  };
  conversations: {
    getConversationContext: typeof getConversationContext;
  };
  appointments: {
    createAppointment: typeof createAppointmentForCustomerService;
    listAppointmentsForCustomer: typeof listCustomerAppointmentsService;
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
      listActiveProducts: listActiveCompanyProducts,
      searchCompanyProducts,
    },
    conversations: {
      getConversationContext: getConversationContext,
    },
    appointments: {
      createAppointment: createAppointmentForCustomerService,
      listAppointmentsForCustomer: listCustomerAppointmentsService,
      cancelAppointment: cancelAppointmentService,
      rescheduleAppointment: rescheduleAppointmentService,
    },
  };
}
