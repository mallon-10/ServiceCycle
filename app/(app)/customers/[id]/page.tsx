import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCustomer } from "../actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { DeleteButton } from "@/components/app/delete-button";
import { Timeline } from "@/components/activity/timeline";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/opportunity-card";
import { getMaintenanceStatus } from "@/components/maintenance/status-badge";
import { formatCurrencyBRL } from "@/lib/format";
import { todayDateString } from "@/lib/maintenance/scheduling";

export default async function CustomerDetailPage({
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

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, document, phone, email, address")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const { data: assets } = await supabase
    .from("assets")
    .select("id, name, category, manufacturer, model")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const assetIds = (assets ?? []).map((a) => a.id);
  const nextEventByAsset = new Map<string, string>();

  if (assetIds.length > 0) {
    const { data: cycleEvents } = await supabase
      .from("cycle_events")
      .select("asset_id, scheduled_date")
      .in("asset_id", assetIds)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: true });

    for (const event of cycleEvents ?? []) {
      if (!nextEventByAsset.has(event.asset_id)) {
        nextEventByAsset.set(event.asset_id, event.scheduled_date);
      }
    }
  }

  const healthCounts = { good: 0, warning: 0, critical: 0, none: 0 };
  for (const assetId of assetIds) {
    const status = getMaintenanceStatus(nextEventByAsset.get(assetId) ?? null);
    healthCounts[status]++;
  }

  const twelveMonthsAhead = new Date();
  twelveMonthsAhead.setUTCFullYear(twelveMonthsAhead.getUTCFullYear() + 1);
  const twelveMonthsStr = twelveMonthsAhead.toISOString().slice(0, 10);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, stage, priority, estimated_value_cents, customer_id, assets(name, customers(name)), cycle_events(scheduled_date)"
    )
    .eq("customer_id", id)
    .not("stage", "in", "(cancelled,no_interest,new_cycle_started,executed)")
    .order("priority", { ascending: true });

  const activeOpportunities = (opportunities ?? []) as unknown as (OpportunityCardData & {
    cycle_events: { scheduled_date: string } | null;
  })[];

  const potentialRevenueCents = activeOpportunities
    .filter((o) => {
      const date = o.cycle_events?.scheduled_date;
      return date && date <= twelveMonthsStr;
    })
    .reduce((sum, o) => sum + (o.estimated_value_cents ?? 0), 0);

  const { data: activityEntries } = await supabase
    .from("activity_log")
    .select("id, event_type, description, created_at")
    .eq("subject_type", "customer")
    .eq("subject_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <LinkText href="/customers" variant="subtle">
            ← Clientes
          </LinkText>
          <PageTitle>{customer.name}</PageTitle>
          <p className="text-sm text-muted-foreground">
            {assetIds.length} ativo{assetIds.length === 1 ? "" : "s"} instalado
            {assetIds.length === 1 ? "" : "s"}
            {potentialRevenueCents > 0 && (
              <>
                {" · "}
                {formatCurrencyBRL(potentialRevenueCents)} de receita potencial
                nos próximos 12 meses
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          <DeleteButton
            action={deleteCustomer}
            hiddenFields={{ id: customer.id }}
            confirmMessage={`Excluir ${customer.name}? Essa ação não pode ser desfeita.`}
          >
            Excluir
          </DeleteButton>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <div className="space-y-3">
        <SectionLabel>Saúde da base</SectionLabel>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-semibold text-status-good-foreground">
                {healthCounts.good}
              </div>
              <div className="text-sm text-muted-foreground">Em dia</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-semibold text-status-warning-foreground">
                {healthCounts.warning}
              </div>
              <div className="text-sm text-muted-foreground">Entrando em manutenção</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-semibold text-status-critical-foreground">
                {healthCounts.critical}
              </div>
              <div className="text-sm text-muted-foreground">Atrasado</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-semibold text-muted-foreground">
                {healthCounts.none}
              </div>
              <div className="text-sm text-muted-foreground">Sem ciclo</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Próximas oportunidades</SectionLabel>
        {activeOpportunities.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma oportunidade prevista para este cliente ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeOpportunities.slice(0, 4).map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                today={today}
                scheduledDate={opp.cycle_events?.scheduled_date}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Ativos</SectionLabel>
          <Link
            href={`/assets/new?customer_id=${customer.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            Novo ativo
          </Link>
        </div>

        {!assets || assets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum ativo cadastrado para este cliente ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {assets.map((asset) => {
              const nextDate = nextEventByAsset.get(asset.id) ?? null;
              const status = getMaintenanceStatus(nextDate);
              return (
                <Link key={asset.id} href={`/assets/${asset.id}`}>
                  <Card className="transition-colors hover:border-primary/40 hover:bg-accent/40">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {[asset.category, asset.manufacturer, asset.model]
                            .filter(Boolean)
                            .join(" · ") || "Sem detalhes adicionais"}
                        </div>
                      </div>
                      <span
                        className={
                          status === "critical"
                            ? "text-xs font-medium text-status-critical-foreground"
                            : status === "warning"
                              ? "text-xs font-medium text-status-warning-foreground"
                              : status === "good"
                                ? "text-xs font-medium text-status-good-foreground"
                                : "text-xs text-muted-foreground"
                        }
                      >
                        {status === "critical"
                          ? "Atrasado"
                          : status === "warning"
                            ? "Em breve"
                            : status === "good"
                              ? "Em dia"
                              : "—"}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionLabel>Histórico</SectionLabel>
        <Card>
          <CardContent className="py-4">
            <Timeline entries={activityEntries ?? []} />
          </CardContent>
        </Card>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Informações do cliente
        </summary>
        <Card className="mt-3">
          <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm">
            <div>
              <div className="text-muted-foreground">CNPJ/CPF</div>
              <div>{customer.document ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Telefone</div>
              <div>{customer.phone ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">E-mail</div>
              <div>{customer.email ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Endereço</div>
              <div>{customer.address ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
      </details>
    </div>
  );
}
