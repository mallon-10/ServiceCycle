"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateNextDate, toDateString } from "@/lib/maintenance/scheduling";

export async function completeMaintenanceEvent(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const eventId = formData.get("event_id") as string;
  const assetId = formData.get("asset_id") as string;
  const notes = (formData.get("completion_notes") as string) || null;

  const { error: updateError } = await supabase
    .from("maintenance_events")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user.user.id,
      completion_notes: notes,
    })
    .eq("id", eventId);

  if (updateError) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(updateError.message)}`);
  }

  const { data: event } = await supabase
    .from("maintenance_events")
    .select("rule_id")
    .eq("id", eventId)
    .single();

  if (event?.rule_id) {
    const { data: rule } = await supabase
      .from("maintenance_rules")
      .select("interval_days, active")
      .eq("id", event.rule_id)
      .single();

    if (rule?.active) {
      const nextDate = calculateNextDate(new Date(), rule.interval_days);

      await supabase.from("maintenance_events").insert({
        tenant_id: profile.tenant_id,
        asset_id: assetId,
        rule_id: event.rule_id,
        scheduled_date: toDateString(nextDate),
        status: "scheduled",
      });
    }
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${assetId}`);
}
