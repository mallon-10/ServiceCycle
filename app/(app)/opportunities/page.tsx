import { createClient } from "@/lib/supabase/server";
import { advanceOpportunityStage } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { StageSelect } from "@/components/opportunities/stage-select";
import { formatCurrencyBRL } from "@/lib/format";
import { todayDateString } from "@/lib/maintenance/scheduling";

type OpportunityEvent = {
  id: string;
  asset_id: string;
  scheduled_date: string;
  opportunity_stage: string;
  assets: { name: string; customers: { name: string } | null } | null;
  maintenance_rules: {
    name: string;
    estimated_value_cents: number | null;
    opportunity_note: string | null;
  } | null;
};

const COLUMNS: { stage: string; label: string }[] = [
  { stage: "generated", label: "Gerada" },
  { stage: "in_contact", label: "Em contato" },
  { stage: "won", label: "Ganha" },
];

function daysUntil(scheduledDate: string, today: string) {
  const diff =
    (new Date(scheduledDate + "T00:00:00Z").getTime() -
      new Date(today + "T00:00:00Z").getTime()) /
    (1000 * 60 * 60 * 24);
  if (diff < 0) return `Venceu há ${Math.abs(Math.round(diff))} dias`;
  if (diff === 0) return "Vence hoje";
  return `Próximos ${Math.round(diff)} dias`;
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const today = todayDateString();

  const { data: events } = await supabase
    .from("maintenance_events")
    .select(
      "id, asset_id, scheduled_date, opportunity_stage, assets(name, customers(name)), maintenance_rules(name, estimated_value_cents, opportunity_note)"
    )
    .eq("status", "scheduled")
    .neq("opportunity_stage", "lost")
    .order("scheduled_date", { ascending: true });

  const opportunities = (events ?? []) as unknown as OpportunityEvent[];

  const totalInPlayCents = opportunities
    .filter((o) => o.opportunity_stage !== "won")
    .reduce((sum, o) => sum + (o.maintenance_rules?.estimated_value_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Oportunidades</PageTitle>
          <p className="text-sm text-muted-foreground">
            Toda manutenção prevista vira proposta: revisão, peça, upgrade ou
            renovação.
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

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma oportunidade em aberto. Elas aparecem aqui automaticamente
            quando uma manutenção é agendada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnItems = opportunities.filter(
              (o) => o.opportunity_stage === column.stage
            );
            return (
              <div key={column.stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{column.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {columnItems.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnItems.map((opp) => {
                    const rule = opp.maintenance_rules;
                    const asset = opp.assets;
                    return (
                      <Card key={opp.id}>
                        <CardContent className="space-y-2 py-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-muted-foreground">
                              {shortId(opp.id)}
                            </span>
                            <span className="text-muted-foreground">
                              {daysUntil(opp.scheduled_date, today)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {rule?.name ?? "Manutenção"}
                            </div>
                            <LinkText
                              href={`/assets/${opp.asset_id}`}
                              variant="subtle"
                            >
                              {asset?.customers?.name ?? asset?.name ?? "Ativo"}
                            </LinkText>
                          </div>
                          {rule?.opportunity_note && (
                            <p className="text-sm text-muted-foreground">
                              {rule.opportunity_note}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {rule?.estimated_value_cents != null ? (
                              <span className="font-mono text-sm">
                                {formatCurrencyBRL(rule.estimated_value_cents)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                          <StageSelect
                            action={advanceOpportunityStage}
                            eventId={opp.id}
                            stage={opp.opportunity_stage}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
