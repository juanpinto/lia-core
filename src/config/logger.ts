import pino from 'pino';
import { sharedEnv } from './shared-env.js';

export const logger = pino({
  level: sharedEnv.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[REDACTED]',
  },
});
