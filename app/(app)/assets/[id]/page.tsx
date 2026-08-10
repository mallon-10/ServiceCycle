import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeMaintenanceEvent } from "../../maintenance-events/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select(
      "id, name, category, manufacturer, model, serial_number, install_date, warranty_expires_at, location, notes, customer_id, customers(name)"
    )
    .eq("id", id)
    .single();

  if (!asset) notFound();

  const customerName = (asset.customers as { name: string } | null)?.name;

  const { data: rules } = await supabase
    .from("maintenance_rules")
    .select("id, name, interval_days, active")
    .eq("asset_id", id)
    .order("created_at", { ascending: false });

  const { data: events } = await supabase
    .from("maintenance_events")
    .select("id, scheduled_date, status, completed_at, completion_notes")
    .eq("asset_id", id)
    .order("scheduled_date", { ascending: false });

  const scheduledEvents = (events ?? []).filter((e) => e.status === "scheduled");
  const pastEvents = (events ?? []).filter((e) => e.status !== "scheduled");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/customers/${asset.customer_id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {customerName ?? "Cliente"}
        </Link>
        <h1 className="text-2xl font-semibold">{asset.name}</h1>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do ativo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Categoria</div>
            <div>{asset.category ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Fabricante</div>
            <div>{asset.manufacturer ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Modelo</div>
            <div>{asset.model ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Número de série</div>
            <div>{asset.serial_number ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Instalado em</div>
            <div>{formatDate(asset.install_date)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Garantia até</div>
            <div>{formatDate(asset.warranty_expires_at)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Localização</div>
            <div>{asset.location ?? "—"}</div>
          </div>
          {asset.notes && (
            <div className="col-span-full">
              <div className="text-muted-foreground">Observações</div>
              <div>{asset.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Regras de manutenção</h2>
        <Link
          href={`/maintenance-rules/new?asset_id=${asset.id}`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Nova regra
        </Link>
      </div>

      {!rules || rules.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma regra de manutenção definida ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-sm text-muted-foreground">
                    A cada {rule.interval_days} dias
                  </div>
                </div>
                <Badge variant={rule.active ? "default" : "secondary"}>
                  {rule.active ? "Ativa" : "Inativa"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-medium">Próximas manutenções</h2>
      {scheduledEvents.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma manutenção agendada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {scheduledEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">
                    Agendada para {formatDate(event.scheduled_date)}
                  </div>
                </div>
                <form action={completeMaintenanceEvent} className="flex items-center gap-2">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="asset_id" value={asset.id} />
                  <Button type="submit" size="sm">
                    Marcar como executada
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-medium">Histórico</h2>
      {pastEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma manutenção registrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {pastEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {formatDate(event.scheduled_date)}
                  </div>
                  <Badge variant="outline">
                    {event.status === "completed" ? "Executada" : "Pulada"}
                  </Badge>
                </div>
                {event.completed_at && (
                  <div className="text-sm text-muted-foreground">
                    Concluída em{" "}
                    {new Date(event.completed_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
                {event.completion_notes && (
                  <div className="mt-1 text-sm">{event.completion_notes}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
