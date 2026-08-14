import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/typography";
import { OperationsMapLoader } from "@/components/map/operations-map-loader";
import type { MapCustomer } from "@/components/map/operations-map";

export default async function MapPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, latitude, longitude, assets(id)")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const geocodedCustomers = customers ?? [];
  const customerIds = geocodedCustomers.map((c) => c.id);

  const completedByCustomer = new Map<string, number>();
  const techniciansByCustomer = new Map<string, Set<string>>();

  if (customerIds.length > 0) {
    const { data: events } = await supabase
      .from("maintenance_events")
      .select(
        "status, technician_id, assets(customer_id), technicians(name)"
      )
      .eq("status", "completed");

    for (const event of events ?? []) {
      const customerId = (event.assets as { customer_id: string } | null)
        ?.customer_id;
      if (!customerId || !customerIds.includes(customerId)) continue;

      completedByCustomer.set(
        customerId,
        (completedByCustomer.get(customerId) ?? 0) + 1
      );

      const techName = (event.technicians as { name: string } | null)?.name;
      if (techName) {
        if (!techniciansByCustomer.has(customerId)) {
          techniciansByCustomer.set(customerId, new Set());
        }
        techniciansByCustomer.get(customerId)!.add(techName);
      }
    }
  }

  const mapCustomers: MapCustomer[] = geocodedCustomers.map((c) => ({
    id: c.id,
    name: c.name,
    latitude: c.latitude as number,
    longitude: c.longitude as number,
    assetCount: (c.assets as { id: string }[] | null)?.length ?? 0,
    completedVisits: completedByCustomer.get(c.id) ?? 0,
    technicianNames: [...(techniciansByCustomer.get(c.id) ?? [])],
  }));

  const totalCustomers = customerIds.length;
  const { count: totalCustomersOverall } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Mapa de operações</PageTitle>
        <p className="text-sm text-muted-foreground">
          Clientes geocodificados a partir do endereço cadastrado, com ativos
          monitorados e histórico de visitas.
        </p>
      </div>

      {totalCustomers === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {totalCustomersOverall && totalCustomersOverall > 0
              ? "Nenhum cliente geocodificado ainda. Edite um cliente e salve o endereço novamente para localizá-lo no mapa."
              : "Nenhum cliente cadastrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          <OperationsMapLoader customers={mapCustomers} />
          <p className="text-xs text-muted-foreground">
            {totalCustomers} de {totalCustomersOverall ?? totalCustomers} clientes
            localizados no mapa. Geocodificação via OpenStreetMap
            (Nominatim), aproximada — não garante precisão de endereço exato.
          </p>
        </>
      )}
    </div>
  );
}
