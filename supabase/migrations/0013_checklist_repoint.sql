-- checklist_items.rule_id already points at cycle_event_templates (the FK
-- target followed the 0010 table rename automatically) — renamed here only
-- for naming consistency with the new entity name, no data movement.
--
-- checklist_results.event_id historically pointed at maintenance_events
-- (now cycle_events). A checklist is filled out during execution, so its
-- real owner is Service, not the predicted cycle_event or the commercial
-- opportunity. Adds service_id (nullable for now) and backfills it from
-- event_id, which works because 0012 preserved the cycle_event's id as the
-- resulting service's id wherever a service was created. The legacy
-- event_id column is kept — not dropped — until this backfill is confirmed
-- correct in production.

alter table public.checklist_items rename column rule_id to cycle_event_template_id;

alter table public.checklist_results
  add column service_id uuid references public.services (id) on delete cascade;

update public.checklist_results cr
set service_id = cr.event_id
where exists (select 1 from public.services s where s.id = cr.event_id);

create index idx_checklist_results_service on public.checklist_results (service_id);

comment on column public.checklist_results.service_id is
  'The real owner of a checklist result — filled out during service execution. event_id (legacy, pointing at cycle_events) is kept for backward compatibility until a future cleanup migration.';
