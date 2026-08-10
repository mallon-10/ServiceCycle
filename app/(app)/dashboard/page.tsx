import { createClient } from "@/lib/supabase/server";
import { completeMaintenanceEvent } from "../maintenance-events/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyStateOnboarding } from "@/components/dashboard/empty-state-onboarding";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { upcomingThresholdDateString } from "@/lib/maintenance/scheduling";

function formatDate(value: string) {
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const threshold = upcomingThresholdDateString();

  const { data: opportunities } = await supabase
    .from("maintenance_events")
    .select(
      "id, scheduled_date, asset_id, assets(name, customers(name))"
    )
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
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Clientes</div>
            <div className="text-3xl font-semibold text-primary">
              {totalCustomers ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Ativos</div>
            <div className="text-3xl font-semibold text-primary">
              {totalAssets ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Oportunidades</div>
            <div className="text-3xl font-semibold text-primary">
              {opportunities?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <SectionLabel>Manutenções pendentes</SectionLabel>

        {!opportunities || opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma manutenção vencendo nos próximos 7 dias.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {opportunities.map((opp) => {
              const asset = opp.assets as {
                name: string;
                customers: { name: string } | null;
              } | null;

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
        )}
      </div>
    </div>
  );
}
