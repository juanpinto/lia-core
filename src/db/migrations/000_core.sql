create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/New_York',
  description text null,
  metadata jsonb null,
  address text null,
  hours_of_operation jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.channel_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel text not null,
  platform_account_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_accounts_channel_check check (
    channel = any (array['whatsapp'::text, 'instagram'::text, 'web'::text, 'manual'::text])
  ),
  constraint channel_accounts_platform_account_unique unique (channel, platform_account_id),
  constraint channel_accounts_company_id_id_unique unique (company_id, id)
);

create index if not exists channel_accounts_company_channel_idx
on public.channel_accounts using btree (company_id, channel);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text null,
  channel text not null,
  platform_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_channel_platform_unique unique (channel, platform_user_id),
  constraint customers_channel_check check (
    channel = any (array['whatsapp'::text, 'instagram'::text, 'web'::text, 'manual'::text])
  )
);

create table if not exists public.company_customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_customers_company_customer_unique unique (company_id, customer_id),
  constraint company_customers_company_id_id_unique unique (company_id, id)
);

create index if not exists company_customers_customer_idx
on public.company_customers using btree (customer_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_customer_id uuid not null references public.company_customers(id) on delete cascade,
  channel_account_id uuid null references public.channel_accounts(id) on delete set null,
  channel text not null,
  status text not null default 'open',
  started_at timestamptz not null default now(),
  metadata jsonb null,
  summary text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_channel_check check (
    channel = any (array['whatsapp'::text, 'instagram'::text, 'web'::text, 'manual'::text])
  ),
  constraint conversations_status_check check (
    status = any (array['open'::text, 'closed'::text])
  ),
  constraint conversations_company_id_id_unique unique (company_id, id),
  constraint conversations_company_customer_company_fk foreign key (company_id, company_customer_id)
    references public.company_customers(company_id, id) on delete cascade,
  constraint conversations_channel_account_company_fk foreign key (company_id, channel_account_id)
    references public.channel_accounts(company_id, id)
);

create index if not exists conversations_company_customer_idx
on public.conversations using btree (company_id, company_customer_id, started_at desc);

create index if not exists conversations_company_channel_customer_updated_idx
on public.conversations using btree (company_id, channel, company_customer_id, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  channel_account_id uuid null references public.channel_accounts(id) on delete set null,
  channel text not null,
  external_message_id text not null,
  direction text not null,
  sender_id text null,
  body text null,
  role text null,
  created_at timestamptz not null default now(),
  constraint messages_channel_check check (
    channel = any (array['whatsapp'::text, 'instagram'::text, 'web'::text, 'manual'::text])
  ),
  constraint messages_direction_check check (
    direction = any (array['inbound'::text, 'outbound'::text])
  ),
  constraint messages_role_check check (
    role is null or role = any (array['user'::text, 'assistant'::text, 'system'::text, 'tool'::text])
  ),
  constraint messages_company_channel_external_unique unique (company_id, channel, external_message_id),
  constraint messages_conversation_company_fk foreign key (company_id, conversation_id)
    references public.conversations(company_id, id) on delete cascade,
  constraint messages_channel_account_company_fk foreign key (company_id, channel_account_id)
    references public.channel_accounts(company_id, id)
);

create index if not exists messages_conversation_created_idx
on public.messages using btree (conversation_id, created_at);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text null,
  active boolean not null default true,
  price integer null check (price is null or price >= 0),
  duration_minutes integer null check (duration_minutes is null or duration_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_company_id_id_unique unique (company_id, id)
);

create index if not exists products_company_active_name_idx
on public.products using btree (company_id, active, name);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_customer_id uuid not null references public.company_customers(id) on delete cascade,
  conversation_id uuid null references public.conversations(id) on delete set null,
  start_at timestamp not null,
  end_at timestamp not null,
  status text not null default 'scheduled',
  created_via text not null default 'whatsapp',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_status_check check (
    status = any (array['scheduled'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])
  ),
  constraint appointments_created_via_check check (
    created_via = any (array['whatsapp'::text, 'instagram'::text, 'web'::text, 'manual'::text])
  ),
  constraint appointments_time_range_check check (end_at > start_at),
  constraint appointments_company_id_id_unique unique (company_id, id),
  constraint appointments_company_customer_company_fk foreign key (company_id, company_customer_id)
    references public.company_customers(company_id, id) on delete cascade,
  constraint appointments_conversation_company_fk foreign key (company_id, conversation_id)
    references public.conversations(company_id, id)
);

create index if not exists appointments_company_start_idx
on public.appointments using btree (company_id, start_at);

create index if not exists appointments_company_customer_status_start_idx
on public.appointments using btree (company_id, company_customer_id, status, start_at);

create table if not exists public.appointment_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_products_appointment_company_fk foreign key (company_id, appointment_id)
    references public.appointments(company_id, id) on delete cascade,
  constraint appointment_products_product_company_fk foreign key (company_id, product_id)
    references public.products(company_id, id) on delete restrict
);

create index if not exists appointment_products_appointment_idx
on public.appointment_products using btree (appointment_id, created_at);

create index if not exists appointment_products_product_idx
on public.appointment_products using btree (product_id);

create table if not exists public.appointment_notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint appointment_notifications_kind_check check (
    kind = any (array['reminder_24h'::text, 'reminder_1h'::text])
  ),
  constraint appointment_notifications_appointment_kind_unique unique (appointment_id, kind)
);

create table if not exists public.executed_actions (
  company_id uuid not null references public.companies(id) on delete cascade,
  action_id text not null,
  action_type text not null,
  conversation_id uuid null references public.conversations(id) on delete set null,
  company_customer_id uuid null references public.company_customers(id) on delete set null,
  request_id text null,
  status text not null default 'ok',
  result_json jsonb null,
  created_at timestamptz not null default now(),
  constraint executed_actions_status_check check (
    status = any (array['ok'::text, 'failed'::text])
  ),
  constraint executed_actions_pkey primary key (company_id, action_id),
  constraint executed_actions_conversation_company_fk foreign key (company_id, conversation_id)
    references public.conversations(company_id, id),
  constraint executed_actions_company_customer_company_fk foreign key (company_id, company_customer_id)
    references public.company_customers(company_id, id)
);

create index if not exists executed_actions_conversation_idx
on public.executed_actions using btree (conversation_id, created_at desc);

create index if not exists executed_actions_company_customer_idx
on public.executed_actions using btree (company_customer_id, created_at desc);

create table if not exists public.pending_actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  company_customer_id uuid not null references public.company_customers(id) on delete cascade,
  action_type text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_actions_status_check check (
    status = any (array['pending'::text, 'resolved'::text, 'expired'::text, 'cancelled'::text])
  ),
  constraint pending_actions_conversation_company_fk foreign key (company_id, conversation_id)
    references public.conversations(company_id, id) on delete cascade,
  constraint pending_actions_company_customer_company_fk foreign key (company_id, company_customer_id)
    references public.company_customers(company_id, id) on delete cascade
);

create index if not exists pending_actions_conversation_status_idx
on public.pending_actions using btree (conversation_id, status, created_at desc);

create index if not exists pending_actions_company_customer_status_idx
on public.pending_actions using btree (company_customer_id, status, created_at desc);

create unique index if not exists pending_actions_active_per_conversation_uidx
on public.pending_actions using btree (conversation_id)
where status = 'pending';

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_users_email_unique unique (email),
  constraint company_users_role_check check (
    role = any (array['admin'::text, 'member'::text])
  )
);

create index if not exists company_users_company_idx
on public.company_users using btree (company_id);

create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger channel_accounts_set_updated_at before update on public.channel_accounts for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger company_customers_set_updated_at before update on public.company_customers for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger appointment_products_set_updated_at before update on public.appointment_products for each row execute function public.set_updated_at();
create trigger pending_actions_set_updated_at before update on public.pending_actions for each row execute function public.set_updated_at();
create trigger company_users_set_updated_at before update on public.company_users for each row execute function public.set_updated_at();
