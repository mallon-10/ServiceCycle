-- A Cycle Template is a reusable named group of maintenance events for a
-- kind of equipment (e.g. "Compressor Atlas GA22": oil change every 500h,
-- filter every 1000h, annual overhaul...). Applying a template to an asset
-- creates its cycle_event_templates (see 0010) in one action, replacing the
-- old one-off "create a rule per asset" flow.

create table public.cycle_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  category_id uuid references public.asset_categories (id) on delete set null,
  manufacturer text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cycle_templates_tenant on public.cycle_templates (tenant_id);

alter table public.cycle_templates enable row level security;

create policy "cycle_templates_select" on public.cycle_templates
  for select using (tenant_id = public.current_tenant_id());
create policy "cycle_templates_insert" on public.cycle_templates
  for insert with check (tenant_id = public.current_tenant_id());
create policy "cycle_templates_update" on public.cycle_templates
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "cycle_templates_delete" on public.cycle_templates
  for delete using (tenant_id = public.current_tenant_id());
