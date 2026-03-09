# lia-core

`lia-core` is the domain service for LIA.

It owns:
- companies
- channel accounts (Meta / Instagram / other channel assets)
- global customers
- company-specific customer links
- conversations + messages
- products
- appointments + appointment line items
- pending actions

## Architecture

This project is intentionally split so that:
- `lia-nervous` can remain the channel gateway
- `lia-brain` can remain the AI decision/orchestration service
- `lia-core` becomes the source of truth for business data

### Identity model

This version uses the long-term model:
- `customers` are global
- `customer_identities` map external channel identities to global customers
- `company_customers` links a customer to a company

That means the same real person can message multiple companies and still be represented by a single global customer record.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Update `DATABASE_URL`.

3. Install dependencies:

```bash
npm install
```

4. Run migrations:

```bash
DOTENV_CONFIG_PATH=.env.local npm run migrate
```

5. Start the service:

```bash
DOTENV_CONFIG_PATH=.env.local npm run dev
```

6. Check health:

```bash
curl http://localhost:3000/health
```

## Suggested integration order from lia-nervous

### Step 1 — companies + channel accounts
Create the company and attach WhatsApp / Instagram assets.

### Step 2 — resolve company customer
When Meta sends you a message, resolve the tenant-aware customer first.

```bash
curl -X POST http://localhost:3000/v1/companies/<companyId>/customers/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "whatsapp",
    "platformUserId": "16414511661",
    "customerName": "Juan"
  }'
```

### Step 3 — create / load conversation
Use `companyCustomerId` for all conversation state.

### Step 4 — persist messages
Write inbound and outbound messages into `lia-core`.

### Step 5 — move product lookup
Search products from `lia-brain` or an MCP adapter through `lia-core`.

### Step 6 — move appointment flows
Create, cancel, reschedule, and list appointments from here.

## Main routes

### Companies
- `POST /v1/companies`
- `GET /v1/companies/:companyId`

### Channel accounts
- `GET /v1/companies/:companyId/channel-accounts`
- `POST /v1/companies/:companyId/channel-accounts`

### Customers
- `GET /v1/companies/:companyId/customers`
- `POST /v1/companies/:companyId/customers`
- `POST /v1/companies/:companyId/customers/resolve`
- `GET /v1/companies/:companyId/customers/:companyCustomerId`

### Products
- `GET /v1/companies/:companyId/products`
- `GET /v1/companies/:companyId/products/search?q=haircut`
- `POST /v1/companies/:companyId/products`

### Conversations
- `POST /v1/companies/:companyId/conversations`
- `GET /v1/companies/:companyId/conversations/:conversationId`
- `GET /v1/companies/:companyId/conversations/:conversationId/messages`
- `POST /v1/companies/:companyId/conversations/:conversationId/messages`

### Appointments
- `POST /v1/companies/:companyId/appointments`
- `GET /v1/companies/:companyId/appointments/:appointmentId`
- `GET /v1/companies/:companyId/appointments/company-customers/:companyCustomerId`
- `POST /v1/companies/:companyId/appointments/:appointmentId/cancel`
- `POST /v1/companies/:companyId/appointments/:appointmentId/reschedule`

### Pending actions
- `GET /v1/companies/:companyId/pending-actions`
- `POST /v1/companies/:companyId/pending-actions`
- `GET /v1/companies/:companyId/pending-actions/:pendingActionId`
- `POST /v1/companies/:companyId/pending-actions/:pendingActionId/resolve`

## Notes

This is production-oriented scaffolding, but deliberately pragmatic.

It already includes:
- strict TypeScript
- request validation with Zod 4
- centralized error handling
- pino logging
- Postgres connection pooling
- a migration runner
- `updated_at` triggers in SQL

It does **not** yet include:
- authentication / service-to-service auth
- rate limiting
- automated tests
- MCP adapter layer
- OpenTelemetry / distributed tracing

Those should be the next layer once `lia-nervous` starts consuming this service successfully.
