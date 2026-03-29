import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
      serviceAuth?: {
        service: "internal" | "gateway";
      };
      dashboardUser?: {
        userId: string;
        companyId: string;
        email: string;
        role: "admin" | "member";
      };
    }
  }
}

export {};
