"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateNextDate, toDateString } from "@/lib/maintenance/scheduling";

export async function createMaintenanceRule(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const assetId = formData.get("asset_id") as string;
  const name = formData.get("name") as string;
  const intervalDays = Number(formData.get("interval_days"));

  if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
    redirect(
      `/maintenance-rules/new?asset_id=${assetId}&error=${encodeURIComponent(
        "Intervalo precisa ser um número de dias maior que zero."
      )}`
    );
  }

  const { data: asset } = await supabase
    .from("assets")
    .select("install_date")
    .eq("id", assetId)
    .single();

  const { data: rule, error: ruleError } = await supabase
    .from("maintenance_rules")
    .insert({
      tenant_id: profile.tenant_id,
      asset_id: assetId,
      name,
      interval_days: intervalDays,
    })
    .select("id")
    .single();

  if (ruleError) {
    redirect(
      `/maintenance-rules/new?asset_id=${assetId}&error=${encodeURIComponent(ruleError.message)}`
    );
  }

  const baseDate = asset?.install_date
    ? new Date(asset.install_date)
    : new Date();
  const nextDate = calculateNextDate(baseDate, intervalDays);

  const { error: eventError } = await supabase.from("maintenance_events").insert({
    tenant_id: profile.tenant_id,
    asset_id: assetId,
    rule_id: rule.id,
    scheduled_date: toDateString(nextDate),
    status: "scheduled",
  });

  if (eventError) {
    redirect(
      `/maintenance-rules/new?asset_id=${assetId}&error=${encodeURIComponent(eventError.message)}`
    );
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${assetId}`);
}
