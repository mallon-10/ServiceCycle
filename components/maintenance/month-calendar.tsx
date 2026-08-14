import Link from "next/link";
import { cn } from "@/lib/utils";
import { getMaintenanceStatus } from "@/components/maintenance/status-badge";

type CalendarEvent = {
  id: string;
  asset_id: string;
  scheduled_date: string;
  technician_id: string | null;
  assets: { name: string; customers: { name: string } | null } | null;
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthCalendar({
  year,
  month,
  events,
}: {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
}) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const day = Number(event.scheduled_date.slice(8, 10));
    if (!eventsByDay.has(day)) eventsByDay.set(day, []);
    eventsByDay.get(day)!.push(event);
  }

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const dayEvents = day ? eventsByDay.get(day) ?? [] : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-28 border-b border-r border-border p-1.5 last:border-r-0",
                !day && "bg-muted/20"
              )}
            >
              {day && (
                <>
                  <div className="mb-1 font-mono text-xs text-muted-foreground">
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const status = getMaintenanceStatus(event.scheduled_date);
                      return (
                        <Link
                          key={event.id}
                          href={`/assets/${event.asset_id}`}
                          className={cn(
                            "block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight",
                            status === "critical" &&
                              "bg-status-critical text-status-critical-foreground",
                            status === "warning" &&
                              "bg-status-warning text-status-warning-foreground",
                            status === "good" &&
                              "bg-status-good text-status-good-foreground",
                            !event.technician_id && "ring-1 ring-inset ring-current"
                          )}
                          title={event.assets?.name ?? "Ativo"}
                        >
                          {event.assets?.name ?? "Ativo"}
                        </Link>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="px-1.5 text-[11px] text-muted-foreground">
                        +{dayEvents.length - 3} mais
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
