"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocoding";

export async function createCustomer(formData: FormData) {
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
  const document = (formData.get("document") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const address = (formData.get("address") as string) || null;
  const geocoded = address ? await geocodeAddress(address) : null;

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: profile.tenant_id,
      name,
      document,
      phone,
      email,
      address,
      latitude: geocoded?.latitude ?? null,
      longitude: geocoded?.longitude ?? null,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/customers/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const document = (formData.get("document") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const address = (formData.get("address") as string) || null;
  const geocoded = address ? await geocodeAddress(address) : null;

  const { error } = await supabase
    .from("customers")
    .update({
      name,
      document,
      phone,
      email,
      address,
      latitude: geocoded?.latitude ?? null,
      longitude: geocoded?.longitude ?? null,
    })
    .eq("id", id);

  if (error) {
    redirect(`/customers/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    const message = error.code === "23503"
      ? "Não é possível excluir: existem ativos vinculados a este cliente. Exclua os ativos primeiro."
      : error.message;
    redirect(`/customers/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/customers");
  redirect("/customers");
}
