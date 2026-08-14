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
  const checkedItemIds = formData.getAll("checked_item") as string[];

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
    const { data: items } = await supabase
      .from("checklist_items")
      .select("id")
      .eq("rule_id", event.rule_id);

    if (items && items.length > 0) {
      await supabase.from("checklist_results").insert(
        items.map((item) => ({
          tenant_id: profile.tenant_id,
          event_id: eventId,
          checklist_item_id: item.id,
          checked: checkedItemIds.includes(item.id),
        }))
      );
    }

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

export async function skipMaintenanceEvent(formData: FormData) {
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

  const { error: updateError } = await supabase
    .from("maintenance_events")
    .update({ status: "skipped" })
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

export async function rescheduleMaintenanceEvent(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const eventId = formData.get("event_id") as string;
  const assetId = formData.get("asset_id") as string;
  const newDate = formData.get("scheduled_date") as string;

  if (!newDate) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent("Escolha uma data.")}`);
  }

  const { error } = await supabase
    .from("maintenance_events")
    .update({ scheduled_date: newDate })
    .eq("id", eventId);

  if (error) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
  redirect(`/assets/${assetId}`);
}
