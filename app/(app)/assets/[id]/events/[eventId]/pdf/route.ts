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

  const { data: event } = await supabase
    .from("maintenance_events")
    .select(
      "id, scheduled_date, completed_at, completion_notes, rule_id, technician_id, maintenance_rules(name), technicians(name)"
    )
    .eq("id", eventId)
    .eq("asset_id", assetId)
    .single();

  if (!event) {
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
    .eq("event_id", eventId);

  const ruleName = (event.maintenance_rules as { name: string } | null)?.name;
  const technicianName = (event.technicians as { name: string } | null)?.name;
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
      ruleName: ruleName ?? null,
      scheduledDate: event.scheduled_date,
      completedAt: event.completed_at,
      technicianName: technicianName ?? null,
      completionNotes: event.completion_notes,
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
      "Content-Disposition": `inline; filename="OS-${asset.name}-${event.scheduled_date}.pdf"`,
    },
  });
}
