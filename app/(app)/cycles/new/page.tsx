import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCycleEventTemplate } from "../actions";
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
import { EventTypeSelect } from "@/components/cycles/event-type-select";

export default async function NewCycleEventPage({
  searchParams,
}: {
  searchParams: Promise<{ asset_id?: string; error?: string }>;
}) {
  const { asset_id: assetId, error } = await searchParams;

  if (!assetId) notFound();

  const supabase = await createClient();
  const { data: asset } = await supabase
    .from("assets")
    .select("id, name")
    .eq("id", assetId)
    .single();

  if (!asset) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <PageTitle>Novo evento de ciclo</PageTitle>
        <p className="text-sm text-muted-foreground">
          Vinculado ao ativo {asset.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCycleEventTemplate} className="space-y-4">
            <input type="hidden" name="asset_id" value={asset.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Troca de filtro, Revisão geral"
              />
            </div>
            <EventTypeSelect />
            <div className="space-y-2">
              <Label htmlFor="interval_value">Periodicidade (dias)</Label>
              <Input
                id="interval_value"
                name="interval_value"
                type="number"
                min={1}
                required
                placeholder="Ex: 180"
              />
              <p className="text-xs text-muted-foreground">
                A próxima ocorrência será calculada automaticamente com base
                nesse intervalo.
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
                defaultValue={0}
              />
              <p className="text-xs text-muted-foreground">
                O ServiceCycle detecta a oportunidade essa quantidade de dias
                antes da data prevista, não só no dia exato.
              </p>
            </div>
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">
                  Receita potencial (opcional)
                </Label>
                <Input
                  id="estimated_value"
                  name="estimated_value"
                  inputMode="decimal"
                  placeholder="Ex: 1800,00"
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
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Salvar evento</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
