import { createClient } from "@/lib/supabase/server";
import { completeMaintenanceEvent } from "../maintenance-events/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { MonthCalendar } from "@/components/maintenance/month-calendar";
import { ViewToggle } from "@/components/app/view-toggle";

const PAGE_SIZE = 20;

function formatDate(value: string) {
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string; month?: string }>;
}) {
  const { page: pageParam, view: viewParam, month: monthParam } =
    await searchParams;
  const view = viewParam === "calendar" ? "calendar" : "list";
  const supabase = await createClient();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Agenda</PageTitle>
          <p className="text-sm text-muted-foreground">
            Todas as manutenções agendadas, de todos os ativos.
          </p>
        </div>
        <ViewToggle current={view} />
      </div>

      {view === "calendar" ? (
        <CalendarView supabase={supabase} monthParam={monthParam} />
      ) : (
        <ListView supabase={supabase} pageParam={pageParam} />
      )}
    </div>
  );
}

async function ListView({
  supabase,
  pageParam,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  pageParam?: string;
}) {
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: events, count } = await supabase
    .from("maintenance_events")
    .select("id, scheduled_date, asset_id, assets(name, customers(name))", {
      count: "exact",
    })
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma manutenção agendada.
        </CardContent>
      </Card>
    );
  }

  return (
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
        buildHref={(p) =>
          `/agenda?${new URLSearchParams({ page: String(p) }).toString()}`
        }
      />
    </>
  );
}

async function CalendarView({
  supabase,
  monthParam,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  monthParam?: string;
}) {
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

  const { data: events } = await supabase
    .from("maintenance_events")
    .select(
      "id, scheduled_date, asset_id, technician_id, assets(name, customers(name))"
    )
    .eq("status", "scheduled")
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd)
    .order("scheduled_date", { ascending: true });

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <div className="flex gap-2">
          <a
            href={`/agenda?view=calendar&month=${prevMonth}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Anterior
          </a>
          <a
            href={`/agenda?view=calendar&month=${nextMonth}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Próximo →
          </a>
        </div>
      </div>
      <MonthCalendar
        year={year}
        month={month}
        events={(events ?? []) as unknown as Parameters<typeof MonthCalendar>[0]["events"]}
      />
      <p className="text-xs text-muted-foreground">
        Contorno destacado indica manutenção sem técnico atribuído.
      </p>
    </div>
  );
}
