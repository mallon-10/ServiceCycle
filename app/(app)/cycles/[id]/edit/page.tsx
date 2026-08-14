import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCycleEventTemplate } from "../../actions";
import { saveChecklistTemplate } from "../../checklist-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChecklistEditor } from "@/components/maintenance/checklist-editor";
import { EventTypeSelect } from "@/components/cycles/event-type-select";

export default async function EditCycleEventTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("cycle_event_templates")
    .select(
      "id, name, event_type, interval_value, commercial_lead_days, asset_id, estimated_value_cents, opportunity_note, assets(name)"
    )
    .eq("id", id)
    .single();

  if (!template) notFound();

  const assetName = (template.assets as { name: string } | null)?.name;

  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select("description")
    .eq("cycle_event_template_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <PageTitle>Editar evento de ciclo</PageTitle>
        <p className="text-sm text-muted-foreground">
          Vinculado ao ativo {assetName}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateCycleEventTemplate} className="space-y-4">
            <input type="hidden" name="id" value={template.id} />
            <input type="hidden" name="asset_id" value={template.asset_id ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required defaultValue={template.name} />
            </div>
            <EventTypeSelect defaultValue={template.event_type} />
            <div className="space-y-2">
              <Label htmlFor="interval_value">Periodicidade (dias)</Label>
              <Input
                id="interval_value"
                name="interval_value"
                type="number"
                min={1}
                required
                defaultValue={template.interval_value}
              />
              <p className="text-xs text-muted-foreground">
                Alterar o intervalo não muda a próxima data já agendada — vale
                a partir da próxima renovação do ciclo.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercial_lead_days">
                Iniciar abordagem comercial (dias antes)
              </Label>
              <Input
                id="commercial_lead_days"
                name="commercial_lead_days"
                type="number"
                min={0}
                defaultValue={template.commercial_lead_days}
              />
            </div>
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">Receita potencial (opcional)</Label>
                <Input
                  id="estimated_value"
                  name="estimated_value"
                  inputMode="decimal"
                  placeholder="Ex: 1800,00"
                  defaultValue={
                    template.estimated_value_cents != null
                      ? (template.estimated_value_cents / 100).toFixed(2).replace(".", ",")
                      : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opportunity_note">
                  Contexto da oportunidade (opcional)
                </Label>
                <Textarea
                  id="opportunity_note"
                  name="opportunity_note"
                  placeholder="Ex: Gerador fora de garantia, risco alto de parada"
                  defaultValue={template.opportunity_note ?? ""}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Salvar alterações</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveChecklistTemplate} className="space-y-4">
            <input type="hidden" name="template_id" value={template.id} />
            <input type="hidden" name="asset_id" value={template.asset_id ?? ""} />
            <ChecklistEditor
              initialItems={(checklistItems ?? []).map((i) => i.description)}
            />
            <Button type="submit" variant="outline">
              Salvar checklist
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
