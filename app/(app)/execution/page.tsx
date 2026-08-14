import { createClient } from "@/lib/supabase/server";
import { completeService, cancelService, scheduleService } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { MonthCalendar } from "@/components/maintenance/month-calendar";
import { ViewToggle } from "@/components/app/view-toggle";
import { CompleteServiceForm } from "@/components/execution/complete-service-form";
import { ScheduleServiceForm } from "@/components/execution/schedule-service-form";

function formatDate(value: string) {
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default async function ExecutionPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; error?: string }>;
}) {
  const { view: viewParam, month: monthParam, error } = await searchParams;
  const view = viewParam === "calendar" ? "calendar" : "list";
  const supabase = await createClient();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Execução</PageTitle>
          <p className="text-sm text-muted-foreground">
            Agenda, serviços aprovados e técnicos.
          </p>
        </div>
        <ViewToggle current={view} />
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      {view === "calendar" ? (
        <CalendarView supabase={supabase} monthParam={monthParam} />
      ) : (
        <ServicesListView supabase={supabase} />
      )}
    </div>
  );
}

async function ServicesListView({
  supabase,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const { data: technicians } = await supabase
    .from("technicians")
    .select("id, name")
    .eq("active", true)
    .order("name", { ascending: true });

  const { data: awaitingEvents } = await supabase
    .from("cycle_events")
    .select("id, scheduled_date, asset_id, assets(name, customers(name))")
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })
    .limit(20);

  const cycleEventIds = (awaitingEvents ?? []).map((e) => e.id);
  const { data: scheduledServiceEventIds } =
    cycleEventIds.length > 0
      ? await supabase
          .from("services")
          .select("cycle_event_id")
          .in("cycle_event_id", cycleEventIds)
      : { data: [] };
  const alreadyScheduled = new Set(
    (scheduledServiceEventIds ?? []).map((s) => s.cycle_event_id)
  );
  const awaitingScheduling = (awaitingEvents ?? []).filter(
    (e) => !alreadyScheduled.has(e.id)
  );

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, scheduled_date, status, technician_id, asset_id, assets(name, customers(name)), technicians(name)"
    )
    .in("status", ["scheduled", "in_progress"])
    .order("scheduled_date", { ascending: true });

  const { data: completedServices } = await supabase
    .from("services")
    .select("id, scheduled_date, completed_at, asset_id, assets(name, customers(name))")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-sm font-medium">
          Aguardando agendamento
          <span className="ml-2 text-muted-foreground">
            ({awaitingScheduling.length})
          </span>
        </h2>
        {awaitingScheduling.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nada aguardando agendamento agora.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {awaitingScheduling.map((event) => {
              const asset = event.assets as {
                name: string;
                customers: { name: string } | null;
              } | null;
              return (
                <Card key={event.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <LinkText href={`/assets/${event.asset_id}`}>
                        {asset?.name ?? "Ativo"}
                      </LinkText>
                      <div className="text-sm text-muted-foreground">
                        {asset?.customers?.name} · Previsto para{" "}
                        {formatDate(event.scheduled_date)}
                      </div>
                    </div>
                    <ScheduleServiceForm
                      action={scheduleService}
                      cycleEventId={event.id}
                      defaultDate={event.scheduled_date}
                      technicians={technicians ?? []}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">
          Agendados
          <span className="ml-2 text-muted-foreground">({(services ?? []).length})</span>
        </h2>
        {!services || services.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhum serviço agendado.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {services.map((service) => {
              const asset = service.assets as {
                name: string;
                customers: { name: string } | null;
              } | null;
              const technician = service.technicians as { name: string } | null;
              return (
                <Card key={service.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <LinkText href={`/assets/${service.asset_id}`}>
                        {asset?.name ?? "Ativo"}
                      </LinkText>
                      <div className="text-sm text-muted-foreground">
                        {asset?.customers?.name} · {formatDate(service.scheduled_date)}
                        {technician && ` · ${technician.name}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={cancelService}>
                        <input type="hidden" name="service_id" value={service.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Cancelar
                        </Button>
                      </form>
                      <CompleteServiceForm
                        action={completeService}
                        serviceId={service.id}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Executados recentemente</h2>
        {!completedServices || completedServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço executado ainda.</p>
        ) : (
          <div className="space-y-2">
            {completedServices.map((service) => {
              const asset = service.assets as {
                name: string;
                customers: { name: string } | null;
              } | null;
              return (
                <Card key={service.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <LinkText href={`/assets/${service.asset_id}`}>
                      {asset?.name ?? "Ativo"}
                    </LinkText>
                    <Badge variant="outline">Executado</Badge>
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

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, scheduled_date, asset_id, technician_id, assets(name, customers(name))"
    )
    .in("status", ["scheduled", "in_progress"])
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
            href={`/execution?view=calendar&month=${prevMonth}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Anterior
          </a>
          <a
            href={`/execution?view=calendar&month=${nextMonth}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Próximo →
          </a>
        </div>
      </div>
      <MonthCalendar
        year={year}
        month={month}
        events={
          (services ?? []).map((s) => ({
            id: s.id,
            asset_id: s.asset_id,
            scheduled_date: s.scheduled_date,
            technician_id: s.technician_id,
            assets: s.assets,
          })) as unknown as Parameters<typeof MonthCalendar>[0]["events"]
        }
      />
      <p className="text-xs text-muted-foreground">
        Contorno destacado indica serviço sem técnico atribuído.
      </p>
    </div>
  );
}
