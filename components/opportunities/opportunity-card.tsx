import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkText } from "@/components/ui/link-text";
import { formatCurrencyBRL } from "@/lib/format";

export type OpportunityCardData = {
  id: string;
  stage: string;
  priority: string;
  estimated_value_cents: number | null;
  customer_id?: string;
  assets: { name: string; customers: { name: string } | null } | null;
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: string; className: string }> = {
  critical: { label: "Crítica", icon: "🔥", className: "bg-status-critical text-status-critical-foreground" },
  high: { label: "Alta", icon: "⚠", className: "bg-status-warning text-status-warning-foreground" },
  medium: { label: "Média", icon: "", className: "bg-muted text-muted-foreground" },
  low: { label: "Baixa", icon: "", className: "bg-muted text-muted-foreground" },
};

const STAGE_LABELS: Record<string, string> = {
  detected: "Detectada",
  ready: "Pronta para ação",
  sent_to_crm: "Enviada ao CRM",
  negotiating: "Em negociação",
  approved: "Aprovada",
  scheduled: "Agendada",
  executed: "Executada",
  new_cycle_started: "Novo ciclo iniciado",
  ignored: "Ignorada",
  no_interest: "Sem interesse",
  cancelled: "Cancelada",
  postponed: "Adiada",
};

function daysUntilLabel(scheduledDate: string | undefined, today: string) {
  if (!scheduledDate) return null;
  const diff = Math.round(
    (new Date(scheduledDate + "T00:00:00Z").getTime() -
      new Date(today + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return `Atrasada há ${Math.abs(diff)} dias`;
  if (diff === 0) return "Vence hoje";
  return `Faltam ${diff} dias`;
}

export function OpportunityCard({
  opportunity,
  today,
  scheduledDate,
  eventName,
}: {
  opportunity: OpportunityCardData;
  today: string;
  scheduledDate?: string;
  eventName?: string;
}) {
  const priority = PRIORITY_CONFIG[opportunity.priority] ?? PRIORITY_CONFIG.medium;
  const asset = opportunity.assets;
  const daysLabel = daysUntilLabel(scheduledDate, today);
  const isOverdue = scheduledDate ? scheduledDate < today : false;

  return (
    <Card className={isOverdue ? "ring-status-critical-foreground/20" : undefined}>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium">
              {priority.icon && <span className="mr-1">{priority.icon}</span>}
              {asset?.name ?? "Ativo"}
            </div>
            <LinkText
              href={opportunity.customer_id ? `/customers/${opportunity.customer_id}` : "/customers"}
              variant="subtle"
            >
              {asset?.customers?.name ?? "Cliente"}
            </LinkText>
          </div>
          <Badge className={priority.className}>{priority.label.toUpperCase()}</Badge>
        </div>

        {eventName && <div className="text-sm text-muted-foreground">{eventName}</div>}

        <div className="flex items-center justify-between text-sm">
          {daysLabel && <span className="text-muted-foreground">{daysLabel}</span>}
          {opportunity.estimated_value_cents != null && (
            <span className="font-mono font-medium">
              {formatCurrencyBRL(opportunity.estimated_value_cents)} em potencial
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-muted-foreground">
            {STAGE_LABELS[opportunity.stage] ?? opportunity.stage}
          </span>
          <LinkText href={`/radar?opportunity=${opportunity.id}`} variant="subtle">
            Abrir oportunidade
          </LinkText>
        </div>
      </CardContent>
    </Card>
  );
}
