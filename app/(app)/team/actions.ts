"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTechnician(formData: FormData) {
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
  const specialty = (formData.get("specialty") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;

  const { data: technician, error } = await supabase
    .from("technicians")
    .insert({
      tenant_id: profile.tenant_id,
      name,
      specialty,
      phone,
      email,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/team/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/team");
  redirect(`/team/${technician.id}/edit`);
}

export async function updateTechnician(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const specialty = (formData.get("specialty") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;

  const { error } = await supabase
    .from("technicians")
    .update({ name, specialty, phone, email })
    .eq("id", id);

  if (error) {
    redirect(`/team/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/team");
  redirect("/team");
}

export async function toggleTechnicianActive(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";

  const { error } = await supabase
    .from("technicians")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    redirect(`/team?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/team");
  redirect("/team");
}

export async function deleteTechnician(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const id = formData.get("id") as string;

  const { error } = await supabase.from("technicians").delete().eq("id", id);

  if (error) {
    const message =
      error.code === "23503"
        ? "Não é possível excluir: este técnico tem manutenções atribuídas. Reatribua-as primeiro."
        : error.message;
    redirect(`/team?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/team");
  redirect("/team");
}
