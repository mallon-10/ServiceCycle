"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Replaces all checklist items of a cycle_event_template with the given
 * descriptions — simplest correct behavior for a small, admin-edited list
 * (avoids diffing add/remove/reorder against existing rows).
 */
export async function replaceChecklistItems(
  tenantId: string,
  cycleEventTemplateId: string,
  descriptions: string[]
) {
  const supabase = await createClient();

  await supabase
    .from("checklist_items")
    .delete()
    .eq("cycle_event_template_id", cycleEventTemplateId);

  const rows = descriptions
    .map((d) => d.trim())
    .filter(Boolean)
    .map((description, i) => ({
      tenant_id: tenantId,
      cycle_event_template_id: cycleEventTemplateId,
      description,
      sort_order: i,
    }));

  if (rows.length > 0) {
    await supabase.from("checklist_items").insert(rows);
  }
}

export async function saveChecklistTemplate(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const templateId = formData.get("template_id") as string;
  const assetId = formData.get("asset_id") as string;
  const descriptions = formData.getAll("item") as string[];

  await replaceChecklistItems(profile.tenant_id, templateId, descriptions);

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}
