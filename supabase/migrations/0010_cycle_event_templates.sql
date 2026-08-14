-- Renames maintenance_rules -> cycle_event_templates and expands it from
-- "one interval-in-days rule tied to one asset" into a proper Cycle Event
-- Template: can belong to a reusable cycle_template, carries a named event
-- type (not just generic "manutenção"), a unit-aware interval (days is the
-- only unit the app calculates against for now — see lib/maintenance/
-- scheduling.ts — but the column exists so future units don't need another
-- migration), and a commercial lead time (how many days before the due date
-- the opportunity should already be raised).
--
-- `rename table` preserves the table's OID, so existing RLS policies,
-- indexes, and constraints (interval_days check, FKs pointing at this
-- table from checklist_items/maintenance_events) all carry over untouched.

alter table public.maintenance_rules rename to cycle_event_templates;

alter table public.cycle_event_templates
  alter column asset_id drop not null;

alter table public.cycle_event_templates
  add column cycle_template_id uuid references public.cycle_templates (id) on delete set null;

alter table public.cycle_event_templates
  add column event_type text not null default 'preventive'
    check (event_type in (
      'preventive', 'revision', 'inspection', 'filter_change', 'oil_change',
      'recharge', 'part_replacement', 'renewal', 'calibration', 'warranty',
      'technical_return', 'preventive_visit'
    ));

comment on column public.cycle_event_templates.event_type is
  'Named kind of cycle event, not a generic "manutenção" — drives display copy across Radar/Execution.';

alter table public.cycle_event_templates
  add column interval_unit text not null default 'days'
    check (interval_unit in ('days', 'weeks', 'months', 'years', 'hours', 'km', 'cycles'));

comment on column public.cycle_event_templates.interval_unit is
  'Only "days" is calculated by the app today (lib/maintenance/scheduling.ts). Other units are stored for a future usage-based scheduling engine — not implemented yet.';

alter table public.cycle_event_templates
  rename column interval_days to interval_value;

alter table public.cycle_event_templates
  add column commercial_lead_days integer not null default 0
    check (commercial_lead_days >= 0);

comment on column public.cycle_event_templates.commercial_lead_days is
  'Days before scheduled_date that the commercial opportunity should be raised. 0 = opportunity and event land on the same day (today''s behavior).';

create index idx_cycle_event_templates_cycle_template
  on public.cycle_event_templates (cycle_template_id);
