"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRuleWithFirstEvent } from "@/lib/maintenance/create-rule";
import { parseCurrencyInputToCents } from "@/lib/format";

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
  const estimatedValueCents = parseCurrencyInputToCents(
    (formData.get("estimated_value") as string) || ""
  );
  const opportunityNote = (formData.get("opportunity_note") as string) || null;

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

  const baseDate = asset?.install_date
    ? new Date(asset.install_date)
    : new Date();

  const { error } = await createRuleWithFirstEvent(supabase, {
    tenantId: profile.tenant_id,
    assetId,
    name,
    intervalDays,
    baseDate,
    estimatedValueCents,
    opportunityNote,
  });

  if (error) {
    redirect(
      `/maintenance-rules/new?asset_id=${assetId}&error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${assetId}`);
}

export async function updateMaintenanceRule(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const assetId = formData.get("asset_id") as string;
  const name = formData.get("name") as string;
  const intervalDays = Number(formData.get("interval_days"));
  const estimatedValueCents = parseCurrencyInputToCents(
    (formData.get("estimated_value") as string) || ""
  );
  const opportunityNote = (formData.get("opportunity_note") as string) || null;

  if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
    redirect(
      `/assets/${assetId}?error=${encodeURIComponent(
        "Intervalo precisa ser um número de dias maior que zero."
      )}`
    );
  }

  const { error } = await supabase
    .from("maintenance_rules")
    .update({
      name,
      interval_days: intervalDays,
      estimated_value_cents: estimatedValueCents,
      opportunity_note: opportunityNote,
    })
    .eq("id", id);

  if (error) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function toggleMaintenanceRuleActive(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const assetId = formData.get("asset_id") as string;
  const active = formData.get("active") === "true";

  const { error } = await supabase
    .from("maintenance_rules")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${assetId}`);
}
