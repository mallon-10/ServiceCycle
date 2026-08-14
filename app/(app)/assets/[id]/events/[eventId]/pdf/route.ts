import { renderToStream } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ServiceOrderDocument } from "@/components/pdf/service-order-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { id: assetId, eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: service } = await supabase
    .from("services")
    .select(
      "id, scheduled_date, completed_at, completion_notes, cycle_event_id, technician_id, technicians(name), cycle_events(cycle_event_templates(name))"
    )
    .eq("id", eventId)
    .eq("asset_id", assetId)
    .single();

  if (!service) {
    return new Response("Not found", { status: 404 });
  }

  const { data: asset } = await supabase
    .from("assets")
    .select(
      "name, category, manufacturer, model, serial_number, customers(name, address)"
    )
    .eq("id", assetId)
    .single();

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  const { data: checklistResults } = await supabase
    .from("checklist_results")
    .select("checked, checklist_items(description)")
    .eq("service_id", service.id);

  const templateName = (
    service.cycle_events as { cycle_event_templates: { name: string } | null } | null
  )?.cycle_event_templates?.name;
  const technicianName = (service.technicians as { name: string } | null)?.name;
  const customer = asset.customers as { name: string; address: string | null } | null;

  const stream = await renderToStream(
    ServiceOrderDocument({
      assetName: asset.name,
      assetCategory: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serialNumber: asset.serial_number,
      customerName: customer?.name ?? null,
      customerAddress: customer?.address ?? null,
      ruleName: templateName ?? null,
      scheduledDate: service.scheduled_date,
      completedAt: service.completed_at,
      technicianName: technicianName ?? null,
      completionNotes: service.completion_notes,
      checklist: (checklistResults ?? []).map((r) => ({
        description:
          (r.checklist_items as { description: string } | null)?.description ?? "",
        checked: r.checked,
      })),
    })
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OS-${asset.name}-${service.scheduled_date}.pdf"`,
    },
  });
}
