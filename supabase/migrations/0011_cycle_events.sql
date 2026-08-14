-- Renames maintenance_events -> cycle_events. This is step 1 of splitting
-- the old single-table "event + opportunity + service" into three real
-- entities (see 0012 for the fission). After this migration, cycle_events
-- still physically carries opportunity_stage/technician_id/completed_at/
-- completed_by/completion_notes — those are NOT removed here. They become
-- dead columns once the application code moves to reading opportunities/
-- services (0012), and are dropped only in a later, separate cleanup
-- migration once that's confirmed safe in production. Never drop columns
-- and create their replacements in the same migration.

alter table public.maintenance_events rename to cycle_events;

alter table public.cycle_events rename column rule_id to template_id;

comment on table public.cycle_events is
  'The purely technical "this asset will need X on date Y" fact. Commercial pipeline lives in opportunities (0012); execution/technician assignment lives in services (0012). opportunity_stage/technician_id/completed_at/completed_by/completion_notes columns are legacy holdovers from before the split — application code should not read them going forward.';
