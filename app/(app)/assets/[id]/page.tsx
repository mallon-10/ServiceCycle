import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAsset } from "../actions";
import { findAssetCategory } from "@/lib/catalog/asset-categories";
import { formatCurrencyBRL } from "@/lib/format";
import { todayDateString } from "@/lib/maintenance/scheduling";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { getMaintenanceStatus } from "@/components/maintenance/status-badge";
import { Timeline } from "@/components/activity/timeline";
import { DeleteButton } from "@/components/app/delete-button";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

const STATUS_LABELS: Record<string, string> = {
  critical: "CRÍTICO",
  warning: "ATENÇÃO",
  good: "EM DIA",
  none: "SEM CICLO",
};

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
  const today = todayDateString();

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

  const { data: nextCycleEvent } = await supabase
    .from("cycle_events")
    .select("id, scheduled_date, template_id, cycle_event_templates(name, event_type)")
    .eq("asset_id", id)
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: openOpportunity } = nextCycleEvent
    ? await supabase
        .from("opportunities")
        .select("id, stage, estimated_value_cents")
        .eq("cycle_event_id", nextCycleEvent.id)
        .maybeSingle()
    : { data: null };

  const status = getMaintenanceStatus(nextCycleEvent?.scheduled_date ?? null);
  const template = nextCycleEvent?.cycle_event_templates as
    | { name: string; event_type: string }
    | null;

  const daysUntil = nextCycleEvent
    ? Math.round(
        (new Date(nextCycleEvent.scheduled_date + "T00:00:00Z").getTime() -
          new Date(today + "T00:00:00Z").getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const { data: activityEntries } = await supabase
    .from("activity_log")
    .select("id, event_type, description, created_at")
    .eq("subject_type", "asset")
    .eq("subject_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

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
            confirmMessage={`Excluir ${asset.name}? Isso também apaga os ciclos e o histórico deste ativo. Essa ação não pode ser desfeita.`}
          >
            Excluir
          </DeleteButton>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Status</div>
            <div
              className={
                status === "critical"
                  ? "text-lg font-semibold text-status-critical-foreground"
                  : status === "warning"
                    ? "text-lg font-semibold text-status-warning-foreground"
                    : "text-lg font-semibold text-status-good-foreground"
              }
            >
              {STATUS_LABELS[status]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Próxima manutenção</div>
            <div className="text-lg font-semibold">
              {daysUntil != null
                ? daysUntil < 0
                  ? `Atrasada ${Math.abs(daysUntil)}d`
                  : `${daysUntil} dias`
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Receita potencial</div>
            <div className="text-lg font-semibold">
              {openOpportunity?.estimated_value_cents != null
                ? formatCurrencyBRL(openOpportunity.estimated_value_cents)
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Oportunidade</div>
            <div className="text-lg font-semibold">
              {openOpportunity ? (
                <LinkText href={`/radar?opportunity=${openOpportunity.id}`}>
                  Ver no Radar
                </LinkText>
              ) : (
                "—"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {nextCycleEvent && (
        <div className="space-y-3">
          <SectionLabel>Situação atual</SectionLabel>
          <Card>
            <CardContent className="space-y-1 py-4">
              <div className="font-medium">{template?.name ?? "Manutenção"}</div>
              <div className="text-sm text-muted-foreground">
                Prevista para: {formatDate(nextCycleEvent.scheduled_date)}
              </div>
              <div className="text-sm text-muted-foreground">
                Faltam: {daysUntil != null && daysUntil >= 0 ? `${daysUntil} dias` : "vencida"}
              </div>
              {openOpportunity && (
                <div className="text-sm text-muted-foreground">
                  Oportunidade: {openOpportunity.id.slice(0, 8).toUpperCase()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionLabel>Linha do tempo</SectionLabel>
          <Card>
            <CardContent className="py-4">
              <Timeline entries={activityEntries ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <SectionLabel>Dados técnicos</SectionLabel>
          <Card>
            {categoryInfo && (
              <div className="relative h-32 w-full overflow-hidden">
                <Image
                  src={categoryInfo.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 480px, 100vw"
                />
                <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
                  Imagem ilustrativa
                </span>
              </div>
            )}
            <CardContent className="grid grid-cols-2 gap-4 pt-4 text-sm">
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Ciclos</SectionLabel>
          <Link
            href={`/cycles/new?asset_id=${asset.id}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Novo ciclo
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie os ciclos de manutenção deste ativo, incluindo checklist e
          histórico de execução, em{" "}
          <LinkText href={`/cycles?asset_id=${asset.id}`}>Ciclos</LinkText>.
        </p>
      </div>
    </div>
  );
}
