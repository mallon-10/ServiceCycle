import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { EVENT_TYPE_LABELS } from "@/components/cycles/event-type-select";

export default async function CycleTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("cycle_templates")
    .select("id, name, manufacturer, model, asset_categories(label)")
    .eq("id", id)
    .single();

  if (!template) notFound();

  const { data: events } = await supabase
    .from("cycle_event_templates")
    .select("id, name, event_type, interval_value, commercial_lead_days, estimated_value_cents")
    .eq("cycle_template_id", id)
    .order("interval_value", { ascending: true });

  const categoryLabel = (template.asset_categories as { label: string } | null)?.label;

  return (
    <div className="space-y-8">
      <div>
        <LinkText href="/cycles" variant="subtle">
          ← Ciclos
        </LinkText>
        <PageTitle>{template.name}</PageTitle>
        <p className="text-sm text-muted-foreground">
          {[categoryLabel, template.manufacturer, template.model]
            .filter(Boolean)
            .join(" · ") || "Sem detalhes adicionais"}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Eventos deste ciclo</SectionLabel>
        </div>

        {!events || events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum evento cadastrado neste ciclo ainda. Eventos são
              adicionados a partir de um ativo específico — vá até o ativo e
              use "Novo evento de ciclo" vinculando a este ciclo.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">
                      {event.name || EVENT_TYPE_LABELS[event.event_type]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      A cada {event.interval_value} dias
                      {event.commercial_lead_days > 0 &&
                        ` · abordagem ${event.commercial_lead_days}d antes`}
                    </div>
                  </div>
                  {event.estimated_value_cents != null && (
                    <div className="font-mono text-sm text-muted-foreground">
                      R$ {(event.estimated_value_cents / 100).toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Link href="/assets" className={buttonVariants({ variant: "outline" })}>
        Ver ativos
      </Link>
    </div>
  );
}
