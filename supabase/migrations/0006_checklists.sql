-- Checklist items are defined per maintenance rule (the template) and
-- results are recorded per event (the actual execution), same split as
-- rule vs. event throughout the rest of the schema.

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  rule_id uuid not null references public.maintenance_rules (id) on delete cascade,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.checklist_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  event_id uuid not null references public.maintenance_events (id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items (id) on delete cascade,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, checklist_item_id)
);

create index idx_checklist_items_rule on public.checklist_items (rule_id);
create index idx_checklist_results_event on public.checklist_results (event_id);

alter table public.checklist_items enable row level security;
alter table public.checklist_results enable row level security;

create policy "checklist_items_select" on public.checklist_items
  for select using (tenant_id = public.current_tenant_id());
create policy "checklist_items_insert" on public.checklist_items
  for insert with check (tenant_id = public.current_tenant_id());
create policy "checklist_items_update" on public.checklist_items
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "checklist_items_delete" on public.checklist_items
  for delete using (tenant_id = public.current_tenant_id());

create policy "checklist_results_select" on public.checklist_results
  for select using (tenant_id = public.current_tenant_id());
create policy "checklist_results_insert" on public.checklist_results
  for insert with check (tenant_id = public.current_tenant_id());
create policy "checklist_results_update" on public.checklist_results
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "checklist_results_delete" on public.checklist_results
  for delete using (tenant_id = public.current_tenant_id());
