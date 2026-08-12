import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createMaintenanceRule } from "../actions";
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

export default async function NewMaintenanceRulePage({
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
        <PageTitle>Nova regra de manutenção</PageTitle>
        <p className="text-sm text-muted-foreground">
          Vinculada ao ativo {asset.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Regra</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMaintenanceRule} className="space-y-4">
            <input type="hidden" name="asset_id" value={asset.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome da manutenção</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Troca de filtro, Revisão geral"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval_days">Intervalo (dias)</Label>
              <Input
                id="interval_days"
                name="interval_days"
                type="number"
                min={1}
                required
                placeholder="Ex: 180"
              />
              <p className="text-xs text-muted-foreground">
                A próxima manutenção será agendada automaticamente com base
                nesse intervalo.
              </p>
            </div>
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">
                  Valor estimado da oportunidade (opcional)
                </Label>
                <Input
                  id="estimated_value"
                  name="estimated_value"
                  inputMode="decimal"
                  placeholder="Ex: 1800,00"
                />
                <p className="text-xs text-muted-foreground">
                  Aparece como valor em jogo na página de Oportunidades quando
                  essa manutenção vencer.
                </p>
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
            <Button type="submit">Salvar regra</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
