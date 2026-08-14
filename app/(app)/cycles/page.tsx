import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteCycleTemplate } from "./actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { DeleteButton } from "@/components/app/delete-button";
import { EVENT_TYPE_LABELS } from "@/components/cycles/event-type-select";

export default async function CyclesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("cycle_templates")
    .select("id, name, manufacturer, model, asset_categories(label)")
    .order("name", { ascending: true });

  const templateIds = (templates ?? []).map((t) => t.id);
  const eventsByTemplate = new Map<
    string,
    { name: string; event_type: string; interval_value: number }[]
  >();

  if (templateIds.length > 0) {
    const { data: events } = await supabase
      .from("cycle_event_templates")
      .select("name, event_type, interval_value, cycle_template_id")
      .in("cycle_template_id", templateIds)
      .order("interval_value", { ascending: true });

    for (const event of events ?? []) {
      if (!event.cycle_template_id) continue;
      if (!eventsByTemplate.has(event.cycle_template_id)) {
        eventsByTemplate.set(event.cycle_template_id, []);
      }
      eventsByTemplate.get(event.cycle_template_id)!.push(event);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Ciclos</PageTitle>
          <p className="text-sm text-muted-foreground">
            Templates reutilizáveis de manutenção por tipo de equipamento —
            crie uma vez, aplique em todo ativo semelhante.
          </p>
        </div>
        <Link href="/cycles/templates/new" className={buttonVariants()}>
          Novo ciclo
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Você ainda não possui um Ciclo configurado.
            <br />
            Crie um ciclo uma única vez e use em todos os equipamentos
            semelhantes.
            <div className="mt-4">
              <Link
                href="/cycles/templates/new"
                className={buttonVariants({ size: "sm" })}
              >
                Criar primeiro ciclo
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => {
            const events = eventsByTemplate.get(template.id) ?? [];
            const categoryLabel = (
              template.asset_categories as { label: string } | null
            )?.label;
            return (
              <Card key={template.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <LinkText href={`/cycles/templates/${template.id}`}>
                        {template.name}
                      </LinkText>
                      <div className="text-sm text-muted-foreground">
                        {[categoryLabel, template.manufacturer, template.model]
                          .filter(Boolean)
                          .join(" · ") || "Sem detalhes adicionais"}
                      </div>
                    </div>
                    <DeleteButton
                      action={deleteCycleTemplate}
                      hiddenFields={{ id: template.id }}
                      confirmMessage={`Excluir o ciclo "${template.name}"? Os eventos já aplicados a ativos não são afetados.`}
                    >
                      Excluir
                    </DeleteButton>
                  </div>
                  {events.length > 0 && (
                    <div className="space-y-1 border-t pt-2 text-sm">
                      {events.map((e, i) => (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span>{e.name || EVENT_TYPE_LABELS[e.event_type]}</span>
                          <span>{e.interval_value}d</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <SectionLabel>Como funciona</SectionLabel>
        <p className="text-sm text-muted-foreground">
          Um Ciclo agrupa os eventos de manutenção de um tipo de equipamento
          (ex: troca de óleo a cada 500h, revisão anual). Ao cadastrar um
          ativo dessa categoria, o ServiceCycle já aplica os eventos
          automaticamente — sem precisar configurar intervalo manualmente
          toda vez.
        </p>
      </div>
    </div>
  );
}
