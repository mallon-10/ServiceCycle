-- ServiceCycle MVP schema: tenants, profiles, customers, assets,
-- maintenance rules/events, notification log, RLS, and signup trigger.

-- ─── Tables ────────────────────────────────────────────────────────────

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  document text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  name text not null,
  category text,
  manufacturer text,
  model text,
  serial_number text,
  install_date date,
  warranty_expires_at date,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  name text not null,
  interval_days integer not null check (interval_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  rule_id uuid references public.maintenance_rules (id) on delete set null,
  scheduled_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  completion_notes text,
  created_at timestamptz not null default now()
);

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  maintenance_event_id uuid references public.maintenance_events (id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email')),
  message text not null,
  would_send_to text,
  created_at timestamptz not null default now()
);

-- ─── Indexes ───────────────────────────────────────────────────────────

create index idx_customers_tenant on public.customers (tenant_id);
create index idx_assets_tenant_customer on public.assets (tenant_id, customer_id);
create index idx_rules_tenant_asset on public.maintenance_rules (tenant_id, asset_id);
create index idx_events_tenant_asset_date on public.maintenance_events (tenant_id, asset_id, scheduled_date);
create index idx_events_tenant_status_date on public.maintenance_events (tenant_id, status, scheduled_date);
create index idx_notifications_tenant on public.notification_log (tenant_id);

-- ─── Tenant resolution helper ─────────────────────────────────────────

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- ─── Row Level Security ────────────────────────────────────────────────

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.assets enable row level security;
alter table public.maintenance_rules enable row level security;
alter table public.maintenance_events enable row level security;
alter table public.notification_log enable row level security;

-- tenants: no direct public policy; accessed only via the signup trigger
-- (security definer) and through profiles.

-- profiles: a user can read their own row and rows in their own tenant.
-- Inserts happen only via the signup trigger (security definer).
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_select_same_tenant" on public.profiles
  for select using (tenant_id = public.current_tenant_id());

-- Generic tenant-isolation policies for business tables.
create policy "customers_select" on public.customers
  for select using (tenant_id = public.current_tenant_id());
create policy "customers_insert" on public.customers
  for insert with check (tenant_id = public.current_tenant_id());
create policy "customers_update" on public.customers
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "customers_delete" on public.customers
  for delete using (tenant_id = public.current_tenant_id());

create policy "assets_select" on public.assets
  for select using (tenant_id = public.current_tenant_id());
create policy "assets_insert" on public.assets
  for insert with check (tenant_id = public.current_tenant_id());
create policy "assets_update" on public.assets
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "assets_delete" on public.assets
  for delete using (tenant_id = public.current_tenant_id());

create policy "maintenance_rules_select" on public.maintenance_rules
  for select using (tenant_id = public.current_tenant_id());
create policy "maintenance_rules_insert" on public.maintenance_rules
  for insert with check (tenant_id = public.current_tenant_id());
create policy "maintenance_rules_update" on public.maintenance_rules
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "maintenance_rules_delete" on public.maintenance_rules
  for delete using (tenant_id = public.current_tenant_id());

create policy "maintenance_events_select" on public.maintenance_events
  for select using (tenant_id = public.current_tenant_id());
create policy "maintenance_events_insert" on public.maintenance_events
  for insert with check (tenant_id = public.current_tenant_id());
create policy "maintenance_events_update" on public.maintenance_events
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "maintenance_events_delete" on public.maintenance_events
  for delete using (tenant_id = public.current_tenant_id());

create policy "notification_log_select" on public.notification_log
  for select using (tenant_id = public.current_tenant_id());
create policy "notification_log_insert" on public.notification_log
  for insert with check (tenant_id = public.current_tenant_id());

-- ─── Signup: create tenant + profile atomically ───────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  company_name text;
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  company_name := coalesce(new.raw_user_meta_data ->> 'company_name', 'Minha Empresa');
  base_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'empresa';
  end if;

  final_slug := base_slug;
  while exists (select 1 from public.tenants where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix::text;
  end loop;

  insert into public.tenants (name, slug)
  values (company_name, final_slug)
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name, role)
  values (new.id, new_tenant_id, new.raw_user_meta_data ->> 'full_name', 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
