import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { calculateNextDate, toDateString } from "@/lib/maintenance/scheduling";

type Params = {
  tenantId: string;
  assetId: string;
  name: string;
  intervalDays: number;
  baseDate: Date;
};

/**
 * Creates a maintenance rule and its first scheduled event together, so a
 * rule is never left without an upcoming date. Shared by the manual
 * rule-creation flow and the automatic rules applied from the asset
 * category catalog.
 */
export async function createRuleWithFirstEvent(
  supabase: SupabaseClient<Database>,
  { tenantId, assetId, name, intervalDays, baseDate }: Params
) {
  const { data: rule, error: ruleError } = await supabase
    .from("maintenance_rules")
    .insert({
      tenant_id: tenantId,
      asset_id: assetId,
      name,
      interval_days: intervalDays,
    })
    .select("id")
    .single();

  if (ruleError) {
    return { error: ruleError };
  }

  const nextDate = calculateNextDate(baseDate, intervalDays);

  const { error: eventError } = await supabase.from("maintenance_events").insert({
    tenant_id: tenantId,
    asset_id: assetId,
    rule_id: rule.id,
    scheduled_date: toDateString(nextDate),
    status: "scheduled",
  });

  if (eventError) {
    return { error: eventError };
  }

  return { error: null };
}
