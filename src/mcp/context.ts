import { resolveCompanyCustomerService } from "../modules/customers/service.js";
import {
  listActiveCompanyProducts,
  searchCompanyProduct,
} from "../modules/products/service.js";
import {
  processInboundMessage,
  processOutboundMessage,
} from "../modules/conversations/service.js";
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
    searchCompanyProduct: typeof searchCompanyProduct;
  };
  conversations: {
    processInboundMessage: typeof processInboundMessage;
    processOutboundMessage: typeof processOutboundMessage;
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
      searchCompanyProduct,
    },
    conversations: {
      processInboundMessage,
      processOutboundMessage,
    },
    appointments: {
      createAppointment: createAppointmentForCustomerService,
      listAppointmentsForCustomer: listCustomerAppointmentsService,
      cancelAppointment: cancelAppointmentService,
      rescheduleAppointment: rescheduleAppointmentService,
    },
  };
}
