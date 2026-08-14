-- Auditable timeline for customers/assets/opportunities/services, and the
-- record of deterministic automations firing (e.g. "opportunity
-- auto-created because a cycle_event entered its commercial window").
-- Deliberately not a separate automation_log table — same shape, same
-- purpose (auditing "what happened and when"); automation entries are just
-- rows here with event_type like 'auto_%', filterable by convention rather
-- than by a second table.

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  subject_type text not null check (subject_type in ('customer', 'asset', 'opportunity', 'service')),
  subject_id uuid not null,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.activity_log.subject_id is
  'Polymorphic reference (no FK) — same pattern as notification_log.maintenance_event_id being the only precedent for a log table in this schema, generalized here since subject_type varies across 4 tables.';
comment on column public.activity_log.event_type is
  'Free text, not a check-constrained enum — new event types are expected to be added as the product grows without needing a migration. Automation-triggered entries are conventionally prefixed "auto_".';

create index idx_activity_log_subject on public.activity_log (tenant_id, subject_type, subject_id, created_at desc);

alter table public.activity_log enable row level security;

create policy "activity_log_select" on public.activity_log
  for select using (tenant_id = public.current_tenant_id());
create policy "activity_log_insert" on public.activity_log
  for insert with check (tenant_id = public.current_tenant_id());
