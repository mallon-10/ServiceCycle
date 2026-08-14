"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";

const VALID_STAGES = [
  "detected", "ready", "sent_to_crm", "negotiating", "approved",
  "scheduled", "executed", "new_cycle_started",
  "ignored", "no_interest", "cancelled", "postponed",
];

const STAGE_LABELS: Record<string, string> = {
  detected: "Detectada",
  ready: "Pronta para ação",
  sent_to_crm: "Enviada ao CRM",
  negotiating: "Em negociação",
  approved: "Aprovada",
  scheduled: "Agendada",
  executed: "Executada",
  new_cycle_started: "Novo ciclo iniciado",
  ignored: "Ignorada",
  no_interest: "Sem interesse",
  cancelled: "Cancelada",
  postponed: "Adiada",
};

export async function advanceOpportunityStage(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const opportunityId = formData.get("opportunity_id") as string;
  const stage = formData.get("stage") as string;

  if (!VALID_STAGES.includes(stage)) {
    redirect(`/radar?error=${encodeURIComponent("Estágio inválido.")}`);
  }

  const update: { stage: string; sent_to_crm_at?: string } = { stage };
  if (stage === "sent_to_crm") {
    update.sent_to_crm_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("opportunities")
    .update(update)
    .eq("id", opportunityId);

  if (error) {
    redirect(`/radar?error=${encodeURIComponent(error.message)}`);
  }

  await logActivity(supabase, {
    tenantId: profile.tenant_id,
    subjectType: "opportunity",
    subjectId: opportunityId,
    eventType: "stage_changed",
    description: `Estágio alterado para "${STAGE_LABELS[stage] ?? stage}"`,
    metadata: { stage },
  });

  revalidatePath("/radar");
  revalidatePath("/dashboard");
  redirect("/radar");
}

export async function createOpportunityForCycleEvent(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const cycleEventId = formData.get("cycle_event_id") as string;

  const { data: event } = await supabase
    .from("cycle_events")
    .select("asset_id, template_id")
    .eq("id", cycleEventId)
    .single();

  if (!event) redirect(`/radar?error=${encodeURIComponent("Evento não encontrado.")}`);

  const { data: asset } = await supabase
    .from("assets")
    .select("customer_id")
    .eq("id", event.asset_id)
    .single();

  const { data: template } = event.template_id
    ? await supabase
        .from("cycle_event_templates")
        .select("estimated_value_cents")
        .eq("id", event.template_id)
        .single()
    : { data: null };

  if (!asset) redirect(`/radar?error=${encodeURIComponent("Ativo não encontrado.")}`);

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .insert({
      tenant_id: profile.tenant_id,
      cycle_event_id: cycleEventId,
      asset_id: event.asset_id,
      customer_id: asset.customer_id,
      stage: "detected",
      priority: "high",
      estimated_value_cents: template?.estimated_value_cents ?? null,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/radar?error=${encodeURIComponent(error.message)}`);
  }

  if (opportunity) {
    await logActivity(supabase, {
      tenantId: profile.tenant_id,
      subjectType: "opportunity",
      subjectId: opportunity.id,
      eventType: "opportunity_created_manually",
      description: "Oportunidade criada manualmente",
      metadata: { cycle_event_id: cycleEventId },
    });
  }

  revalidatePath("/radar");
  revalidatePath("/dashboard");
  redirect("/radar");
}
