import { Users, Wrench, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { completeMaintenanceEvent } from "../maintenance-events/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyStateOnboarding } from "@/components/dashboard/empty-state-onboarding";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import {
  todayDateString,
  upcomingThresholdDateString,
} from "@/lib/maintenance/scheduling";

type Opportunity = {
  id: string;
  scheduled_date: string;
  asset_id: string;
  assets: { name: string; customers: { name: string } | null } | null;
};

function formatDate(value: string) {
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function OpportunityList({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className="space-y-2">
      {opportunities.map((opp) => {
        const asset = opp.assets;
        return (
          <Card key={opp.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MaintenanceStatusBadge nextDate={opp.scheduled_date} />
                <div>
                  <LinkText href={`/assets/${opp.asset_id}`}>
                    {asset?.name ?? "Ativo"}
                  </LinkText>
                  <div className="text-sm text-muted-foreground">
                    {asset?.customers?.name} · {formatDate(opp.scheduled_date)}
                  </div>
                </div>
              </div>
              <form action={completeMaintenanceEvent}>
                <input type="hidden" name="event_id" value={opp.id} />
                <input type="hidden" name="asset_id" value={opp.asset_id} />
                <Button type="submit" size="sm">
                  Marcar como executada
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = todayDateString();
  const threshold = upcomingThresholdDateString();

  const { data: opportunities } = await supabase
    .from("maintenance_events")
    .select("id, scheduled_date, asset_id, assets(name, customers(name))")
    .eq("status", "scheduled")
    .lte("scheduled_date", threshold)
    .order("scheduled_date", { ascending: true });

  const { count: totalAssets } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true });

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (!totalCustomers) {
    return <EmptyStateOnboarding />;
  }

  const allOpportunities = (opportunities ?? []) as unknown as Opportunity[];
  const overdue = allOpportunities.filter((o) => o.scheduled_date < today);
  const dueSoon = allOpportunities.filter((o) => o.scheduled_date >= today);

  return (
    <div className="space-y-8">
      <div>
        <PageTitle>Dashboard</PageTitle>
        <p className="text-sm text-muted-foreground">
          Oportunidades de manutenção vencidas ou vencendo nos próximos 7 dias.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Clientes</div>
              <div className="text-3xl font-semibold tabular-nums text-foreground">
                {totalCustomers ?? 0}
              </div>
            </div>
            <Users className="size-4 text-muted-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Ativos</div>
              <div className="text-3xl font-semibold tabular-nums text-foreground">
                {totalAssets ?? 0}
              </div>
            </div>
            <Wrench className="size-4 text-muted-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
        <Card className="ring-status-critical-foreground/15">
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Vencidas</div>
              <div className="text-3xl font-semibold tabular-nums text-status-critical-foreground">
                {overdue.length}
              </div>
            </div>
            <AlertTriangle
              className="size-4 text-status-critical-foreground"
              strokeWidth={2}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <SectionLabel>Vencidas — ação urgente</SectionLabel>
        {overdue.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma manutenção vencida. Em dia.
            </CardContent>
          </Card>
        ) : (
          <OpportunityList opportunities={overdue} />
        )}
      </div>

      <div className="space-y-3">
        <SectionLabel>Vencendo nos próximos 7 dias</SectionLabel>
        {dueSoon.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma manutenção vencendo nos próximos 7 dias.
            </CardContent>
          </Card>
        ) : (
          <OpportunityList opportunities={dueSoon} />
        )}
      </div>
    </div>
  );
}
