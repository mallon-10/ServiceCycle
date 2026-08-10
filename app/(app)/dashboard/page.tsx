import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { completeMaintenanceEvent } from "../maintenance-events/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  todayDateString,
  upcomingThresholdDateString,
} from "@/lib/maintenance/scheduling";

function formatDate(value: string) {
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = todayDateString();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Oportunidades de manutenção vencidas ou vencendo nos próximos 7 dias.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Clientes</div>
            <div className="text-2xl font-semibold">{totalCustomers ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Ativos</div>
            <div className="text-2xl font-semibold">{totalAssets ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Oportunidades</div>
            <div className="text-2xl font-semibold">
              {opportunities?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-medium">Manutenções pendentes</h2>

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
            const isOverdue = opp.scheduled_date < today;

            return (
              <Card key={opp.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/assets/${opp.asset_id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {asset?.name ?? "Ativo"}
                      </Link>
                      {isOverdue && (
                        <Badge variant="destructive">Vencida</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {asset?.customers?.name} · {formatDate(opp.scheduled_date)}
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
  );
}
