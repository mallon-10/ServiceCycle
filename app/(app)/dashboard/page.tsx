import { TrendingUp, Target, AlertTriangle, Clock, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyStateOnboarding } from "@/components/dashboard/empty-state-onboarding";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { formatCurrencyBRL } from "@/lib/format";
import { todayDateString } from "@/lib/maintenance/scheduling";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/opportunity-card";

const WINDOW_DAYS = 60;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null };

  const today = todayDateString();
  const windowEnd = new Date();
  windowEnd.setUTCDate(windowEnd.getUTCDate() + WINDOW_DAYS);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (!totalCustomers) {
    return <EmptyStateOnboarding />;
  }

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, stage, priority, estimated_value_cents, sent_to_crm_at, customer_id, cycle_events(scheduled_date), assets(name, customers(name))"
    )
    .not("stage", "in", "(cancelled,no_interest,new_cycle_started)")
    .order("priority", { ascending: true });

  const allOpportunities = (opportunities ?? []) as unknown as (OpportunityCardData & {
    sent_to_crm_at: string | null;
    cycle_events: { scheduled_date: string } | null;
  })[];

  const inWindow = allOpportunities.filter((o) => {
    const date = o.cycle_events?.scheduled_date;
    return date && date <= windowEndStr;
  });

  const totalPotentialCents = inWindow.reduce(
    (sum, o) => sum + (o.estimated_value_cents ?? 0),
    0
  );
  const needsAction = inWindow.filter((o) =>
    ["detected", "ready"].includes(o.stage)
  ).length;
  const inProgress = inWindow.filter((o) =>
    ["negotiating", "approved", "scheduled"].includes(o.stage)
  ).length;
  const sentToCrm = inWindow.filter((o) => o.sent_to_crm_at).length;

  const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const topPriorities = [...inWindow]
    .filter((o) => ["detected", "ready", "sent_to_crm"].includes(o.stage))
    .sort((a, b) => {
      const rankDiff = priorityRank[a.priority] - priorityRank[b.priority];
      if (rankDiff !== 0) return rankDiff;
      return (a.cycle_events?.scheduled_date ?? "").localeCompare(
        b.cycle_events?.scheduled_date ?? ""
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <PageTitle>
          {greeting()}
          {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </PageTitle>
        <p className="text-sm text-muted-foreground">
          {inWindow.length > 0
            ? `O ServiceCycle encontrou ${inWindow.length} oportunidade${inWindow.length === 1 ? "" : "s"} de pós-venda nos próximos ${WINDOW_DAYS} dias.`
            : `Nenhuma oportunidade prevista nos próximos ${WINDOW_DAYS} dias — o ServiceCycle está monitorando sua base.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Receita potencial</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">
                {formatCurrencyBRL(totalPotentialCents)}
              </div>
            </div>
            <TrendingUp className="size-4 text-status-good-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Detectadas</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">
                {inWindow.length}
              </div>
            </div>
            <Target className="size-4 text-muted-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
        <Card className="ring-status-critical-foreground/15">
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Precisam de ação</div>
              <div className="text-2xl font-semibold tabular-nums text-status-critical-foreground">
                {needsAction}
              </div>
            </div>
            <AlertTriangle className="size-4 text-status-critical-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Em andamento</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">
                {inProgress}
              </div>
            </div>
            <Clock className="size-4 text-muted-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm text-muted-foreground">Enviadas ao CRM</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">
                {sentToCrm}
              </div>
            </div>
            <Send className="size-4 text-muted-foreground" strokeWidth={2} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <SectionLabel>Prioridades de hoje</SectionLabel>
        {topPriorities.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nada urgente agora. O ServiceCycle avisa aqui assim que uma nova
              oportunidade for detectada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topPriorities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                today={today}
                scheduledDate={opp.cycle_events?.scheduled_date}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
