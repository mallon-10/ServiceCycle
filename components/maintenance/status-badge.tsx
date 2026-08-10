import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  todayDateString,
  upcomingThresholdDateString,
} from "@/lib/maintenance/scheduling";

export type MaintenanceStatus = "critical" | "warning" | "good" | "none";

export function getMaintenanceStatus(
  nextDate: string | null
): MaintenanceStatus {
  if (!nextDate) return "none";
  const today = todayDateString();
  const threshold = upcomingThresholdDateString();
  if (nextDate < today) return "critical";
  if (nextDate <= threshold) return "warning";
  return "good";
}

const STATUS_CONFIG: Record<
  Exclude<MaintenanceStatus, "none">,
  { label: string; icon: typeof AlertCircle; className: string }
> = {
  critical: {
    label: "Vencida",
    icon: AlertCircle,
    className: "bg-status-critical text-status-critical-foreground",
  },
  warning: {
    label: "Vencendo",
    icon: Clock,
    className: "bg-status-warning text-status-warning-foreground",
  },
  good: {
    label: "Em dia",
    icon: CheckCircle2,
    className: "bg-status-good text-status-good-foreground",
  },
};

export function MaintenanceStatusBadge({
  nextDate,
  className,
}: {
  nextDate: string | null;
  className?: string;
}) {
  const status = getMaintenanceStatus(nextDate);

  if (status === "none") {
    return (
      <span
        className={cn(
          "inline-flex h-5 w-fit items-center gap-1 rounded-4xl border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        Sem manutenção agendada
      </span>
    );
  }

  const { label, icon: Icon, className: statusClassName } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center gap-1 rounded-4xl px-2 py-0.5 text-xs font-medium",
        statusClassName,
        className
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
