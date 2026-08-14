import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAsset } from "../actions";
import {
  completeMaintenanceEvent,
  skipMaintenanceEvent,
  rescheduleMaintenanceEvent,
} from "../../maintenance-events/actions";
import { toggleMaintenanceRuleActive } from "../../maintenance-rules/actions";
import { findAssetCategory } from "@/lib/catalog/asset-categories";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { RescheduleForm } from "@/components/maintenance/reschedule-form";
import { DeleteButton } from "@/components/app/delete-button";

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
      "id, name, category, category_slug, manufacturer, model, serial_number, install_date, warranty_expires_at, location, notes, customer_id, customers(name)"
    )
    .eq("id", id)
    .single();

  if (!asset) notFound();

  const customerName = (asset.customers as { name: string } | null)?.name;
  const categoryInfo = findAssetCategory(asset.category_slug);

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
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <LinkText href={`/customers/${asset.customer_id}`} variant="subtle">
            ← {customerName ?? "Cliente"}
          </LinkText>
          <div className="flex items-center gap-3">
            <PageTitle>{asset.name}</PageTitle>
            {asset.category && <Badge variant="secondary">{asset.category}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/assets/${asset.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          <DeleteButton
            action={deleteAsset}
            hiddenFields={{ id: asset.id, customer_id: asset.customer_id }}
            confirmMessage={`Excluir ${asset.name}? Isso também apaga as regras de manutenção e o histórico deste ativo. Essa ação não pode ser desfeita.`}
          >
            Excluir
          </DeleteButton>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <div className="space-y-3">
        <SectionLabel>Dados do ativo</SectionLabel>
        <Card>
          {categoryInfo && (
            <div className="relative h-40 w-full overflow-hidden">
              <Image
                src={categoryInfo.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 640px, 100vw"
              />
              <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
                Imagem ilustrativa
              </span>
            </div>
          )}
          <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm sm:grid-cols-3">
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Regras de manutenção</SectionLabel>
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
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/maintenance-rules/${rule.id}/edit`}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleMaintenanceRuleActive}>
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="asset_id" value={asset.id} />
                      <input type="hidden" name="active" value={String(rule.active)} />
                      <button type="submit">
                        <Badge
                          variant={rule.active ? "default" : "secondary"}
                          className="cursor-pointer"
                        >
                          {rule.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionLabel>Próximas manutenções</SectionLabel>
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
                <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="flex items-center gap-3">
                    <MaintenanceStatusBadge nextDate={event.scheduled_date} />
                    <div className="font-medium">
                      {formatDate(event.scheduled_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RescheduleForm
                      action={rescheduleMaintenanceEvent}
                      eventId={event.id}
                      assetId={asset.id}
                      currentDate={event.scheduled_date}
                    />
                    <form action={skipMaintenanceEvent}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="asset_id" value={asset.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Pular
                      </Button>
                    </form>
                    <form action={completeMaintenanceEvent}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="asset_id" value={asset.id} />
                      <Button type="submit" size="sm">
                        Marcar como executada
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionLabel>Histórico</SectionLabel>
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
    </div>
  );
}
