"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const VALID_PROVIDERS = [
  "salesforce", "hubspot", "pipedrive", "rdstation",
  "erp_generic", "webhook", "zapier", "make", "n8n",
];

/**
 * Stub connect/disconnect — no real OAuth or API call. Flips persisted
 * status so the Integrations screen has real state to read, matching the
 * product brief's explicit instruction not to fake a working integration.
 */
export async function toggleIntegrationConnection(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const provider = formData.get("provider") as string;
  const category = formData.get("category") as string;
  const currentStatus = formData.get("current_status") as string;

  if (!VALID_PROVIDERS.includes(provider)) {
    redirect(`/integrations?error=${encodeURIComponent("Integração inválida.")}`);
  }

  const nextStatus = currentStatus === "connected" ? "not_connected" : "connected";

  const { error } = await supabase.from("integrations").upsert(
    {
      tenant_id: profile.tenant_id,
      provider,
      category,
      status: nextStatus,
      connected_at: nextStatus === "connected" ? new Date().toISOString() : null,
    },
    { onConflict: "tenant_id,provider" }
  );

  if (error) {
    redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/integrations");
  redirect("/integrations");
}
