"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const VALID_STAGES = ["generated", "in_contact", "won", "lost"];

export async function advanceOpportunityStage(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const eventId = formData.get("event_id") as string;
  const stage = formData.get("stage") as string;

  if (!VALID_STAGES.includes(stage)) {
    redirect(
      `/opportunities?error=${encodeURIComponent("Estágio inválido.")}`
    );
  }

  const { error } = await supabase
    .from("maintenance_events")
    .update({ opportunity_stage: stage })
    .eq("id", eventId);

  if (error) {
    redirect(`/opportunities?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/opportunities");
  redirect("/opportunities");
}

export async function assignTechnician(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const eventId = formData.get("event_id") as string;
  const technicianId = (formData.get("technician_id") as string) || null;

  const { error } = await supabase
    .from("maintenance_events")
    .update({ technician_id: technicianId })
    .eq("id", eventId);

  if (error) {
    redirect(`/opportunities?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/opportunities");
  revalidatePath("/agenda");
  redirect("/opportunities");
}
