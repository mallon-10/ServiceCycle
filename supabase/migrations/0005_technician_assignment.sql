-- Lets a maintenance event be assigned to a technician for execution,
-- independent of its commercial opportunity_stage (added in 0003).

alter table public.maintenance_events
  add column technician_id uuid references public.technicians (id) on delete set null;

create index idx_events_technician on public.maintenance_events (technician_id);
