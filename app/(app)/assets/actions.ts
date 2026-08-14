"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findAssetCategory } from "@/lib/catalog/asset-categories";
import { createCycleEventTemplateWithFirstEvent } from "@/lib/cycle/create-cycle-event";
import { logActivity } from "@/lib/activity/log";

export async function createAsset(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const customerId = formData.get("customer_id") as string;
  const name = formData.get("name") as string;
  const categorySlug = (formData.get("category_slug") as string) || null;
  const category = findAssetCategory(categorySlug)?.label ?? null;
  const manufacturer = (formData.get("manufacturer") as string) || null;
  const model = (formData.get("model") as string) || null;
  const serialNumber = (formData.get("serial_number") as string) || null;
  const installDate = (formData.get("install_date") as string) || null;
  const warrantyExpiresAt =
    (formData.get("warranty_expires_at") as string) || null;
  const location = (formData.get("location") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { data: asset, error } = await supabase
    .from("assets")
    .insert({
      tenant_id: profile.tenant_id,
      customer_id: customerId,
      name,
      category,
      category_slug: categorySlug,
      manufacturer,
      model,
      serial_number: serialNumber,
      install_date: installDate,
      warranty_expires_at: warrantyExpiresAt,
      location,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    redirect(
      `/assets/new?customer_id=${customerId}&error=${encodeURIComponent(error.message)}`
    );
  }

  const catalogCategory = findAssetCategory(categorySlug);
  if (catalogCategory && catalogCategory.rules.length > 0) {
    const baseDate = installDate ? new Date(installDate) : new Date();
    for (const ruleTemplate of catalogCategory.rules) {
      await createCycleEventTemplateWithFirstEvent(supabase, {
        tenantId: profile.tenant_id,
        assetId: asset.id,
        name: ruleTemplate.name,
        eventType: "preventive",
        intervalValue: ruleTemplate.intervalDays,
        baseDate,
      });
    }
  }

  await logActivity(supabase, {
    tenantId: profile.tenant_id,
    subjectType: "asset",
    subjectId: asset.id,
    eventType: "asset_created",
    description: `Ativo "${name}" cadastrado`,
    metadata: { category_slug: categorySlug },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const manufacturer = (formData.get("manufacturer") as string) || null;
  const model = (formData.get("model") as string) || null;
  const serialNumber = (formData.get("serial_number") as string) || null;
  const installDate = (formData.get("install_date") as string) || null;
  const warrantyExpiresAt =
    (formData.get("warranty_expires_at") as string) || null;
  const location = (formData.get("location") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase
    .from("assets")
    .update({
      name,
      manufacturer,
      model,
      serial_number: serialNumber,
      install_date: installDate,
      warranty_expires_at: warrantyExpiresAt,
      location,
      notes,
    })
    .eq("id", id);

  if (error) {
    redirect(`/assets/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/assets/${id}`);
  revalidatePath("/assets");
  redirect(`/assets/${id}`);
}

export async function deleteAsset(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const customerId = formData.get("customer_id") as string;

  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) {
    redirect(`/assets/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/assets");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");
  redirect(`/customers/${customerId}`);
}
