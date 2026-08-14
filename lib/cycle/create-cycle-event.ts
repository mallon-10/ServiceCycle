import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { toDateString } from "@/lib/maintenance/scheduling";
import { maybeCreateOpportunityForCycleEvent } from "@/lib/opportunities/detect";
import { logActivity } from "@/lib/activity/log";

type CreateTemplateParams = {
  tenantId: string;
  assetId: string;
  name: string;
  eventType: string;
  intervalValue: number;
  intervalUnit?: string;
  commercialLeadDays?: number;
  baseDate: Date;
  estimatedValueCents?: number | null;
  opportunityNote?: string | null;
  cycleTemplateId?: string | null;
};

/**
 * Creates a cycle_event_template and its first scheduled cycle_event
 * together, so a template is never left without an upcoming date —
 * generalized replacement for the old createRuleWithFirstEvent. Also
 * checks whether that first event already falls inside its commercial
 * window and raises the opportunity immediately if so, and records both
 * on the asset's activity_log.
 */
export async function createCycleEventTemplateWithFirstEvent(
  supabase: SupabaseClient<Database>,
  {
    tenantId,
    assetId,
    name,
    eventType,
    intervalValue,
    intervalUnit = "days",
    commercialLeadDays = 0,
    baseDate,
    estimatedValueCents,
    opportunityNote,
    cycleTemplateId,
  }: CreateTemplateParams
) {
  const { data: template, error: templateError } = await supabase
    .from("cycle_event_templates")
    .insert({
      tenant_id: tenantId,
      asset_id: assetId,
      name,
      event_type: eventType,
      interval_value: intervalValue,
      interval_unit: intervalUnit,
      commercial_lead_days: commercialLeadDays,
      estimated_value_cents: estimatedValueCents ?? null,
      opportunity_note: opportunityNote ?? null,
      cycle_template_id: cycleTemplateId ?? null,
    })
    .select("id")
    .single();

  if (templateError) {
    return { error: templateError };
  }

  return createNextCycleEvent(supabase, {
    tenantId,
    assetId,
    templateId: template.id,
    fromDate: baseDate,
  });
}

/**
 * Computes the next scheduled_date from a template's interval (days-only
 * for now — see cycle_event_templates.interval_unit) and inserts the
 * cycle_event, then checks the commercial window. Shared by template
 * creation and by "service completed -> next cycle" (closing the loop).
 */
export async function createNextCycleEvent(
  supabase: SupabaseClient<Database>,
  {
    tenantId,
    assetId,
    templateId,
    fromDate,
  }: { tenantId: string; assetId: string; templateId: string; fromDate: Date }
) {
  const { data: template } = await supabase
    .from("cycle_event_templates")
    .select("interval_value, interval_unit, active")
    .eq("id", templateId)
    .single();

  if (!template || !template.active) {
    return { error: null, cycleEventId: null };
  }

  // Only "days" is calculated today; other units fall back to the numeric
  // value as days until a usage-based scheduling engine exists.
  const nextDate = new Date(
    Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate())
  );
  nextDate.setUTCDate(nextDate.getUTCDate() + template.interval_value);

  const { data: event, error: eventError } = await supabase
    .from("cycle_events")
    .insert({
      tenant_id: tenantId,
      asset_id: assetId,
      template_id: templateId,
      scheduled_date: toDateString(nextDate),
      status: "scheduled",
    })
    .select("id")
    .single();

  if (eventError) {
    return { error: eventError, cycleEventId: null };
  }

  await logActivity(supabase, {
    tenantId,
    subjectType: "asset",
    subjectId: assetId,
    eventType: "cycle_event_scheduled",
    description: `Próximo ciclo calculado para ${toDateString(nextDate)}`,
    metadata: { cycle_event_id: event.id, template_id: templateId },
  });

  await maybeCreateOpportunityForCycleEvent(supabase, {
    tenantId,
    cycleEventId: event.id,
  });

  return { error: null, cycleEventId: event.id };
}
