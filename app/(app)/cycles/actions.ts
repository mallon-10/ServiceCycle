"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCycleEventTemplateWithFirstEvent } from "@/lib/cycle/create-cycle-event";
import { parseCurrencyInputToCents } from "@/lib/format";

export async function createCycleEventTemplate(formData: FormData) {
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
  const eventType = (formData.get("event_type") as string) || "preventive";
  const intervalValue = Number(formData.get("interval_value"));
  const commercialLeadDays = Number(formData.get("commercial_lead_days")) || 0;
  const estimatedValueCents = parseCurrencyInputToCents(
    (formData.get("estimated_value") as string) || ""
  );
  const opportunityNote = (formData.get("opportunity_note") as string) || null;

  if (!Number.isFinite(intervalValue) || intervalValue <= 0) {
    redirect(
      `/cycles/new?asset_id=${assetId}&error=${encodeURIComponent(
        "Intervalo precisa ser um número maior que zero."
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

  const { error } = await createCycleEventTemplateWithFirstEvent(supabase, {
    tenantId: profile.tenant_id,
    assetId,
    name,
    eventType,
    intervalValue,
    commercialLeadDays,
    baseDate,
    estimatedValueCents,
    opportunityNote,
  });

  if (error) {
    redirect(
      `/cycles/new?asset_id=${assetId}&error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  revalidatePath("/cycles");
  redirect(`/assets/${assetId}`);
}

export async function updateCycleEventTemplate(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const assetId = formData.get("asset_id") as string;
  const name = formData.get("name") as string;
  const eventType = (formData.get("event_type") as string) || "preventive";
  const intervalValue = Number(formData.get("interval_value"));
  const commercialLeadDays = Number(formData.get("commercial_lead_days")) || 0;
  const estimatedValueCents = parseCurrencyInputToCents(
    (formData.get("estimated_value") as string) || ""
  );
  const opportunityNote = (formData.get("opportunity_note") as string) || null;

  if (!Number.isFinite(intervalValue) || intervalValue <= 0) {
    redirect(
      `/assets/${assetId}?error=${encodeURIComponent(
        "Intervalo precisa ser um número maior que zero."
      )}`
    );
  }

  const { error } = await supabase
    .from("cycle_event_templates")
    .update({
      name,
      event_type: eventType,
      interval_value: intervalValue,
      commercial_lead_days: commercialLeadDays,
      estimated_value_cents: estimatedValueCents,
      opportunity_note: opportunityNote,
    })
    .eq("id", id);

  if (error) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/cycles");
  redirect(`/assets/${assetId}`);
}

export async function toggleCycleEventTemplateActive(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const assetId = formData.get("asset_id") as string;
  const active = formData.get("active") === "true";

  const { error } = await supabase
    .from("cycle_event_templates")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${assetId}`);
}

export async function createCycleTemplate(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const name = formData.get("name") as string;
  const categoryId = (formData.get("category_id") as string) || null;
  const manufacturer = (formData.get("manufacturer") as string) || null;
  const model = (formData.get("model") as string) || null;

  const { data: template, error } = await supabase
    .from("cycle_templates")
    .insert({
      tenant_id: profile.tenant_id,
      name,
      category_id: categoryId,
      manufacturer,
      model,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/cycles/templates/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cycles");
  redirect(`/cycles/templates/${template.id}`);
}

export async function deleteCycleTemplate(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;

  const { error } = await supabase.from("cycle_templates").delete().eq("id", id);

  if (error) {
    redirect(`/cycles?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cycles");
  redirect("/cycles");
}
