"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const category = (formData.get("category") as string) || null;
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

  revalidatePath(`/customers/${customerId}`);
  redirect(`/assets/${asset.id}`);
}
