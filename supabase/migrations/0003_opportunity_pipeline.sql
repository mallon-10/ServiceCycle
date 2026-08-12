-- Adds the commercial opportunity pipeline on top of maintenance rules and
-- events. `maintenance_events.status` tracks technical execution
-- (scheduled/completed/skipped); `opportunity_stage` tracks the separate
-- sales funnel (generated/in_contact/won/lost) for the same event. A
-- maintenance can be "won" commercially before it is technically executed.

alter table public.maintenance_rules
  add column estimated_value_cents integer,
  add column opportunity_note text;

comment on column public.maintenance_rules.estimated_value_cents is
  'Optional estimated R$ value (in cents) of the opportunity generated when this rule''s maintenance comes due. Inherited by every event the rule generates.';
comment on column public.maintenance_rules.opportunity_note is
  'Optional short context shown on the opportunity card (e.g. "Gerador fora de garantia, risco alto de parada"). Falls back to the rule name when absent.';

alter table public.maintenance_events
  add column opportunity_stage text not null default 'generated'
    check (opportunity_stage in ('generated', 'in_contact', 'won', 'lost'));

comment on column public.maintenance_events.opportunity_stage is
  'Commercial pipeline stage, independent of `status`. "lost" exists so a stalled opportunity can be moved out of the active board without deleting history; not shown as a board column yet.';
