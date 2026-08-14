-- Fission of cycle_events into its two real entities: Opportunity (the
-- commercial potential of a predicted need) and Service (the physical
-- execution by a technician). Never treated as the same thing again.
--
-- Data migration strategy: INSERT...SELECT reusing the original
-- cycle_events.id as the new row's id in both tables. This preserves any
-- external reference to that id (e.g. notification_log.maintenance_event_id,
-- which still points at cycle_events after the 0011 rename) without needing
-- an id-mapping table. No cycle_events row is deleted or altered here.
--
-- Backfill criteria:
--   -> becomes an opportunity if opportunity_stage != 'generated'
--      (i.e. someone already worked it commercially) OR its template had
--      an estimated value (worth tracking as pipeline even if still fresh).
--   -> becomes a service if it has a technician_id assigned OR status is
--      completed/skipped (i.e. execution already happened or was decided).
-- A cycle_event can become both, neither, or just one — that's expected:
-- a freshly scheduled event with no value and no technician is still just
-- a plain future need, not yet a tracked opportunity or a service.

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  cycle_event_id uuid not null references public.cycle_events (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  stage text not null default 'detected'
    check (stage in (
      'detected', 'ready', 'sent_to_crm', 'negotiating', 'approved',
      'scheduled', 'executed', 'new_cycle_started',
      'ignored', 'no_interest', 'cancelled', 'postponed'
    )),
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  estimated_value_cents integer,
  detected_at timestamptz not null default now(),
  sent_to_crm_at timestamptz,
  crm_reference text,
  responsible_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.opportunities.asset_id is
  'Denormalized from cycle_event_id for query/RLS convenience, matching the pattern already used throughout this schema (e.g. maintenance_events.asset_id was derivable via rule_id too).';
comment on column public.opportunities.customer_id is
  'Denormalized from asset_id->customer_id for the same reason.';
comment on column public.opportunities.priority is
  'Calculated by application code (lib/opportunities/priority.ts via Server Action), not a DB trigger — recomputed on creation and on stage change. First version is rule-based (overdue/proximity/value/asset criticality); structured to support a smarter scoring model later without a schema change.';
comment on column public.opportunities.crm_reference is
  'Stub for a future real CRM integration (see integrations table, 0015) — free text for now, not a validated external id.';

create index idx_opportunities_tenant on public.opportunities (tenant_id);
create index idx_opportunities_cycle_event on public.opportunities (cycle_event_id);
create index idx_opportunities_asset on public.opportunities (asset_id);
create index idx_opportunities_customer on public.opportunities (customer_id);
create index idx_opportunities_tenant_stage on public.opportunities (tenant_id, stage);

alter table public.opportunities enable row level security;

create policy "opportunities_select" on public.opportunities
  for select using (tenant_id = public.current_tenant_id());
create policy "opportunities_insert" on public.opportunities
  for insert with check (tenant_id = public.current_tenant_id());
create policy "opportunities_update" on public.opportunities
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "opportunities_delete" on public.opportunities
  for delete using (tenant_id = public.current_tenant_id());

create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  cycle_event_id uuid references public.cycle_events (id) on delete set null,
  asset_id uuid not null references public.assets (id) on delete cascade,
  technician_id uuid references public.technicians (id) on delete set null,
  scheduled_date date not null,
  scheduled_time time,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  completion_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.services.opportunity_id is
  'Nullable — a service can be scheduled directly without a formal opportunity (e.g. ad-hoc corrective visit), matching the requirement that scheduling stays usable without forcing every job through the commercial pipeline.';
comment on column public.services.cycle_event_id is
  'Nullable, but populated whenever the service originates from a predicted cycle event — this is what lets "service completed" recalculate the next cycle_event from the right cycle_event_template even when opportunity_id is null.';

create index idx_services_tenant on public.services (tenant_id);
create index idx_services_opportunity on public.services (opportunity_id);
create index idx_services_cycle_event on public.services (cycle_event_id);
create index idx_services_asset on public.services (asset_id);
create index idx_services_technician on public.services (technician_id);
create index idx_services_tenant_status_date on public.services (tenant_id, status, scheduled_date);

alter table public.services enable row level security;

create policy "services_select" on public.services
  for select using (tenant_id = public.current_tenant_id());
create policy "services_insert" on public.services
  for insert with check (tenant_id = public.current_tenant_id());
create policy "services_update" on public.services
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "services_delete" on public.services
  for delete using (tenant_id = public.current_tenant_id());

-- Backfill from existing cycle_events, id preserved.

insert into public.opportunities (
  id, tenant_id, cycle_event_id, asset_id, customer_id, stage,
  estimated_value_cents, detected_at, created_at, updated_at
)
select
  ce.id,
  ce.tenant_id,
  ce.id,
  ce.asset_id,
  a.customer_id,
  ce.opportunity_stage,
  cet.estimated_value_cents,
  ce.created_at,
  ce.created_at,
  ce.created_at
from public.cycle_events ce
join public.assets a on a.id = ce.asset_id
left join public.cycle_event_templates cet on cet.id = ce.template_id
where ce.opportunity_stage <> 'generated'
   or cet.estimated_value_cents is not null;

insert into public.services (
  id, tenant_id, opportunity_id, cycle_event_id, asset_id, technician_id,
  scheduled_date, status, completed_at, completed_by, completion_notes,
  created_at, updated_at
)
select
  ce.id,
  ce.tenant_id,
  case when exists (select 1 from public.opportunities o where o.id = ce.id)
    then ce.id else null end,
  ce.id,
  ce.asset_id,
  ce.technician_id,
  ce.scheduled_date,
  case ce.status
    when 'completed' then 'completed'
    when 'skipped' then 'cancelled'
    else 'scheduled'
  end,
  ce.completed_at,
  ce.completed_by,
  ce.completion_notes,
  ce.created_at,
  ce.created_at
from public.cycle_events ce
where ce.technician_id is not null
   or ce.status in ('completed', 'skipped');
