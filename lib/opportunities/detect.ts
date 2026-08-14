import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { todayDateString } from "@/lib/maintenance/scheduling";
import { calculateOpportunityPriority } from "@/lib/opportunities/priority";
import { logActivity } from "@/lib/activity/log";

/**
 * The deterministic "QUANDO evento entra na janela comercial ENTÃO cria
 * oportunidade" automation from the product brief. Not a cron job — called
 * inline whenever a cycle_event is created or its date changes, since that
 * covers every path that could newly put an event inside its window
 * (template creation, reschedule, next-cycle calculation). Idempotent: does
 * nothing if an opportunity for this cycle_event already exists.
 */
export async function maybeCreateOpportunityForCycleEvent(
  supabase: SupabaseClient<Database>,
  { tenantId, cycleEventId }: { tenantId: string; cycleEventId: string }
) {
  const { data: existing } = await supabase
    .from("opportunities")
    .select("id")
    .eq("cycle_event_id", cycleEventId)
    .maybeSingle();

  if (existing) return { created: false };

  const { data: event } = await supabase
    .from("cycle_events")
    .select("id, asset_id, scheduled_date, template_id, status")
    .eq("id", cycleEventId)
    .single();

  if (!event || event.status !== "scheduled") return { created: false };

  const { data: template } = event.template_id
    ? await supabase
        .from("cycle_event_templates")
        .select("commercial_lead_days, estimated_value_cents")
        .eq("id", event.template_id)
        .single()
    : { data: null };

  const leadDays = template?.commercial_lead_days ?? 0;
  const today = todayDateString();
  const windowStart = new Date(event.scheduled_date + "T00:00:00Z");
  windowStart.setUTCDate(windowStart.getUTCDate() - leadDays);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  if (windowStartStr > today) return { created: false };

  const { data: asset } = await supabase
    .from("assets")
    .select("customer_id")
    .eq("id", event.asset_id)
    .single();

  if (!asset) return { created: false };

  const daysUntilDue = Math.round(
    (new Date(event.scheduled_date + "T00:00:00Z").getTime() -
      new Date(today + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const priority = calculateOpportunityPriority({
    daysUntilDue,
    estimatedValueCents: template?.estimated_value_cents ?? null,
  });

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .insert({
      tenant_id: tenantId,
      cycle_event_id: cycleEventId,
      asset_id: event.asset_id,
      customer_id: asset.customer_id,
      stage: "detected",
      priority,
      estimated_value_cents: template?.estimated_value_cents ?? null,
    })
    .select("id")
    .single();

  if (error || !opportunity) return { created: false };

  await logActivity(supabase, {
    tenantId,
    subjectType: "opportunity",
    subjectId: opportunity.id,
    eventType: "auto_opportunity_detected",
    description: "Oportunidade detectada automaticamente pelo ServiceCycle",
    metadata: { cycle_event_id: cycleEventId, trigger: "commercial_lead_days_reached" },
  });

  return { created: true, opportunityId: opportunity.id };
}
