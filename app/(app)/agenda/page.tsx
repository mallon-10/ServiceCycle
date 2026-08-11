import { createClient } from "@/lib/supabase/server";
import { completeMaintenanceEvent } from "../maintenance-events/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";

const PAGE_SIZE = 20;

function formatDate(value: string) {
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: events, count } = await supabase
    .from("maintenance_events")
    .select("id, scheduled_date, asset_id, assets(name, customers(name))", {
      count: "exact",
    })
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Agenda</PageTitle>
        <p className="text-sm text-muted-foreground">
          Todas as manutenções agendadas, de todos os ativos, ordenadas por
          data.
        </p>
      </div>

      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma manutenção agendada.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {events.map((event) => {
              const asset = event.assets as {
                name: string;
                customers: { name: string } | null;
              } | null;

              return (
                <Card key={event.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="flex items-center gap-3">
                      <MaintenanceStatusBadge nextDate={event.scheduled_date} />
                      <div>
                        <LinkText href={`/assets/${event.asset_id}`}>
                          {asset?.name ?? "Ativo"}
                        </LinkText>
                        <div className="text-sm text-muted-foreground">
                          {asset?.customers?.name} · {formatDate(event.scheduled_date)}
                        </div>
                      </div>
                    </div>
                    <form action={completeMaintenanceEvent}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="asset_id" value={event.asset_id} />
                      <Button type="submit" size="sm">
                        Marcar como executada
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            buildHref={(p) => `/agenda?${new URLSearchParams({ page: String(p) }).toString()}`}
          />
        </>
      )}
    </div>
  );
}
