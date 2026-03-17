FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN mkdir -p dist/db/migrations && cp src/db/migrations/*.sql dist/db/migrations/

FROM base AS runtime
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh && chown -R node:node /app /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "const http=require('node:http'); const port=Number(process.env.HEALTHCHECK_PORT || process.env.MCP_PORT || process.env.PORT || 3000); const path=process.env.HEALTHCHECK_PATH || '/health'; const timeout=Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000); const req=http.get({host:'127.0.0.1', port, path, timeout}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); });"]

CMD ["/usr/local/bin/docker-entrypoint.sh"]
