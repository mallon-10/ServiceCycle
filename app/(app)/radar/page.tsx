import { createClient } from "@/lib/supabase/server";
import { advanceOpportunityStage } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { StageSelect, STAGE_LABELS } from "@/components/opportunities/stage-select";
import { RadarPeriodFilter, RadarFilterBar } from "@/components/opportunities/radar-filters";
import { formatCurrencyBRL } from "@/lib/format";
import { todayDateString } from "@/lib/maintenance/scheduling";

type RadarOpportunity = {
  id: string;
  stage: string;
  priority: string;
  estimated_value_cents: number | null;
  sent_to_crm_at: string | null;
  customer_id: string;
  assets: { name: string; customers: { name: string } | null } | null;
  cycle_events: { scheduled_date: string; cycle_event_templates: { event_type: string; name: string } | null } | null;
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "CRÍTICA",
  high: "ALTA",
  medium: "MÉDIA",
  low: "BAIXA",
};

const PRIORITY_CLASSES: Record<string, string> = {
  critical: "bg-status-critical text-status-critical-foreground",
  high: "bg-status-warning text-status-warning-foreground",
  medium: "bg-muted text-muted-foreground",
  low: "bg-muted text-muted-foreground",
};

function daysUntil(scheduledDate: string, today: string) {
  const diff = Math.round(
    (new Date(scheduledDate + "T00:00:00Z").getTime() -
      new Date(today + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return diff;
}

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    period?: string;
    priority?: string;
    stage?: string;
    crm?: string;
    error?: string;
  }>;
}) {
  const { q, period, priority, stage, crm, error } = await searchParams;
  const supabase = await createClient();
  const today = todayDateString();

  let query = supabase
    .from("opportunities")
    .select(
      "id, stage, priority, estimated_value_cents, sent_to_crm_at, customer_id, assets(name, customers(name)), cycle_events(scheduled_date, cycle_event_templates(event_type, name))"
    )
    .not("stage", "in", "(cancelled,no_interest,new_cycle_started)");

  if (priority) query = query.eq("priority", priority);
  if (stage) query = query.eq("stage", stage);
  if (crm === "sent") query = query.not("sent_to_crm_at", "is", null);
  if (crm === "not_sent") query = query.is("sent_to_crm_at", null);

  const { data: rawOpportunities } = await query;
  let opportunities = (rawOpportunities ?? []) as unknown as RadarOpportunity[];

  if (period) {
    if (period === "overdue") {
      opportunities = opportunities.filter(
        (o) => o.cycle_events && o.cycle_events.scheduled_date < today
      );
    } else if (period === "today") {
      opportunities = opportunities.filter(
        (o) => o.cycle_events?.scheduled_date === today
      );
    } else {
      const days = Number(period);
      const threshold = new Date();
      threshold.setUTCDate(threshold.getUTCDate() + days);
      const thresholdStr = threshold.toISOString().slice(0, 10);
      opportunities = opportunities.filter(
        (o) => o.cycle_events && o.cycle_events.scheduled_date <= thresholdStr
      );
    }
  }

  if (q) {
    const needle = q.toLowerCase();
    opportunities = opportunities.filter((o) => {
      const assetName = o.assets?.name?.toLowerCase() ?? "";
      const customerName = o.assets?.customers?.name?.toLowerCase() ?? "";
      return assetName.includes(needle) || customerName.includes(needle);
    });
  }

  const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  opportunities.sort((a, b) => {
    const rankDiff = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
    if (rankDiff !== 0) return rankDiff;
    return (a.cycle_events?.scheduled_date ?? "").localeCompare(
      b.cycle_events?.scheduled_date ?? ""
    );
  });

  const totalInPlayCents = opportunities
    .filter((o) => !["executed", "new_cycle_started"].includes(o.stage))
    .reduce((sum, o) => sum + (o.estimated_value_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Radar</PageTitle>
          <p className="text-sm text-muted-foreground">
            Toda necessidade prevista de manutenção vira uma oportunidade
            rastreável aqui.
          </p>
        </div>
        {totalInPlayCents > 0 && (
          <Card className="shrink-0">
            <CardContent className="py-2 px-4">
              <div className="text-xs text-muted-foreground">Em jogo</div>
              <div className="font-semibold tabular-nums text-status-good-foreground">
                {formatCurrencyBRL(totalInPlayCents)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <div className="space-y-3">
        <RadarPeriodFilter current={period ?? ""} />
        <RadarFilterBar />
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma oportunidade encontrada para este filtro.
            <br />O ServiceCycle continua monitorando sua base instalada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp) => {
            const template = opp.cycle_events?.cycle_event_templates;
            const scheduledDate = opp.cycle_events?.scheduled_date;
            const days = scheduledDate ? daysUntil(scheduledDate, today) : null;
            return (
              <Card key={opp.id}>
                <CardContent className="flex flex-wrap items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {opp.assets?.customers?.name ?? "Cliente"}
                      </span>
                      <Badge className={PRIORITY_CLASSES[opp.priority]}>
                        {PRIORITY_LABELS[opp.priority] ?? opp.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <LinkText href={`/assets`} variant="subtle">
                        {opp.assets?.name ?? "Ativo"}
                      </LinkText>
                      {template && ` · ${template.name}`}
                    </div>
                  </div>

                  <div className="w-28 text-sm text-muted-foreground">
                    {days != null
                      ? days < 0
                        ? `Atrasada ${Math.abs(days)}d`
                        : days === 0
                          ? "Hoje"
                          : `${days} dias`
                      : "—"}
                  </div>

                  <div className="w-28 text-right font-mono text-sm">
                    {opp.estimated_value_cents != null
                      ? formatCurrencyBRL(opp.estimated_value_cents)
                      : "—"}
                  </div>

                  <div className="w-44">
                    <StageSelect
                      action={advanceOpportunityStage}
                      opportunityId={opp.id}
                      stage={opp.stage}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
