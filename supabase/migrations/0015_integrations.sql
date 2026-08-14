-- Stub for external connections (CRM/ERP/generic). Deliberately no real API
-- calls, OAuth flow, or webhook receiver here — just UI + persisted state
-- (not_connected/connected/error) so the Integrations screen has something
-- real to read and write. Wiring an actual provider is future work.

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider text not null check (provider in (
    'salesforce', 'hubspot', 'pipedrive', 'rdstation',
    'erp_generic', 'webhook', 'zapier', 'make', 'n8n'
  )),
  category text not null check (category in ('crm', 'erp', 'generic')),
  status text not null default 'not_connected'
    check (status in ('not_connected', 'connected', 'error')),
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index idx_integrations_tenant on public.integrations (tenant_id);

alter table public.integrations enable row level security;

create policy "integrations_select" on public.integrations
  for select using (tenant_id = public.current_tenant_id());
create policy "integrations_insert" on public.integrations
  for insert with check (tenant_id = public.current_tenant_id());
create policy "integrations_update" on public.integrations
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "integrations_delete" on public.integrations
  for delete using (tenant_id = public.current_tenant_id());
