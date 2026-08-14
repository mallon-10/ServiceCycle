"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createNextCycleEvent } from "@/lib/cycle/create-cycle-event";
import { logActivity } from "@/lib/activity/log";

/**
 * Turns a pending cycle_event into a scheduled service — the moment a
 * predicted need becomes an actual job with a technician and a date.
 * Links opportunity_id when one exists for this cycle_event, always links
 * cycle_event_id so "service completed" can find its way back to the
 * template that generated it, even for services scheduled without a
 * formal opportunity.
 */
export async function scheduleService(formData: FormData) {
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
  const technicianId = (formData.get("technician_id") as string) || null;
  const scheduledDate = formData.get("scheduled_date") as string;

  const { data: event } = await supabase
    .from("cycle_events")
    .select("asset_id")
    .eq("id", cycleEventId)
    .single();

  if (!event) redirect(`/execution?error=${encodeURIComponent("Evento não encontrado.")}`);

  if (!scheduledDate) {
    redirect(`/execution?error=${encodeURIComponent("Escolha uma data.")}`);
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id")
    .eq("cycle_event_id", cycleEventId)
    .maybeSingle();

  const { data: service, error } = await supabase
    .from("services")
    .insert({
      tenant_id: profile.tenant_id,
      opportunity_id: opportunity?.id ?? null,
      cycle_event_id: cycleEventId,
      asset_id: event.asset_id,
      technician_id: technicianId,
      scheduled_date: scheduledDate,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/execution?error=${encodeURIComponent(error.message)}`);
  }

  if (opportunity) {
    await supabase
      .from("opportunities")
      .update({ stage: "scheduled" })
      .eq("id", opportunity.id);
  }

  if (service) {
    await logActivity(supabase, {
      tenantId: profile.tenant_id,
      subjectType: "service",
      subjectId: service.id,
      eventType: "service_scheduled",
      description: "Serviço agendado",
      metadata: { technician_id: technicianId, cycle_event_id: cycleEventId },
    });
  }

  revalidatePath("/execution");
  revalidatePath("/radar");
  redirect("/execution");
}

export async function assignServiceTechnician(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const serviceId = formData.get("service_id") as string;
  const technicianId = (formData.get("technician_id") as string) || null;

  const { error } = await supabase
    .from("services")
    .update({ technician_id: technicianId })
    .eq("id", serviceId);

  if (error) {
    redirect(`/execution?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/execution");
  redirect("/execution");
}

export async function rescheduleService(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const serviceId = formData.get("service_id") as string;
  const newDate = formData.get("scheduled_date") as string;

  if (!newDate) {
    redirect(`/execution?error=${encodeURIComponent("Escolha uma data.")}`);
  }

  const { error } = await supabase
    .from("services")
    .update({ scheduled_date: newDate })
    .eq("id", serviceId);

  if (error) {
    redirect(`/execution?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/execution");
  redirect("/execution");
}

export async function completeService(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) redirect("/login");

  const serviceId = formData.get("service_id") as string;
  const notes = (formData.get("completion_notes") as string) || null;
  const checkedItemIds = formData.getAll("checked_item") as string[];

  const { data: service, error: updateError } = await supabase
    .from("services")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user.user.id,
      completion_notes: notes,
    })
    .eq("id", serviceId)
    .select("asset_id, cycle_event_id, opportunity_id")
    .single();

  if (updateError || !service) {
    redirect(`/execution?error=${encodeURIComponent(updateError?.message ?? "Erro")}`);
    return;
  }

  if (service.cycle_event_id) {
    const { data: cycleEvent } = await supabase
      .from("cycle_events")
      .select("template_id")
      .eq("id", service.cycle_event_id)
      .single();

    await supabase
      .from("cycle_events")
      .update({ status: "completed" })
      .eq("id", service.cycle_event_id);

    const { data: items } = cycleEvent?.template_id
      ? await supabase
          .from("checklist_items")
          .select("id")
          .eq("cycle_event_template_id", cycleEvent.template_id)
      : { data: null };

    if (items && items.length > 0) {
      await supabase.from("checklist_results").insert(
        items.map((item) => ({
          tenant_id: profile.tenant_id,
          service_id: serviceId,
          event_id: service.cycle_event_id!,
          checklist_item_id: item.id,
          checked: checkedItemIds.includes(item.id),
        }))
      );
    }

    if (cycleEvent?.template_id) {
      await createNextCycleEvent(supabase, {
        tenantId: profile.tenant_id,
        assetId: service.asset_id,
        templateId: cycleEvent.template_id,
        fromDate: new Date(),
      });
    }
  }

  if (service.opportunity_id) {
    await supabase
      .from("opportunities")
      .update({ stage: "executed" })
      .eq("id", service.opportunity_id);
  }

  await logActivity(supabase, {
    tenantId: profile.tenant_id,
    subjectType: "service",
    subjectId: serviceId,
    eventType: "service_completed",
    description: "Serviço executado — próximo ciclo calculado",
  });

  revalidatePath("/execution");
  revalidatePath("/dashboard");
  revalidatePath("/radar");
  revalidatePath(`/assets/${service.asset_id}`);
  redirect("/execution");
}

export async function cancelService(formData: FormData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const serviceId = formData.get("service_id") as string;

  const { error } = await supabase
    .from("services")
    .update({ status: "cancelled" })
    .eq("id", serviceId);

  if (error) {
    redirect(`/execution?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/execution");
  redirect("/execution");
}
