import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMaintenanceRule } from "../../actions";
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

export default async function EditMaintenanceRulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: rule } = await supabase
    .from("maintenance_rules")
    .select(
      "id, name, interval_days, asset_id, estimated_value_cents, opportunity_note, assets(name)"
    )
    .eq("id", id)
    .single();

  if (!rule) notFound();

  const assetName = (rule.assets as { name: string } | null)?.name;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <PageTitle>Editar regra de manutenção</PageTitle>
        <p className="text-sm text-muted-foreground">
          Vinculada ao ativo {assetName}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Regra</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateMaintenanceRule} className="space-y-4">
            <input type="hidden" name="id" value={rule.id} />
            <input type="hidden" name="asset_id" value={rule.asset_id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome da manutenção</Label>
              <Input id="name" name="name" required defaultValue={rule.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval_days">Intervalo (dias)</Label>
              <Input
                id="interval_days"
                name="interval_days"
                type="number"
                min={1}
                required
                defaultValue={rule.interval_days}
              />
              <p className="text-xs text-muted-foreground">
                Alterar o intervalo não muda a próxima data já agendada — vale
                a partir da próxima renovação do ciclo.
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
                  defaultValue={
                    rule.estimated_value_cents != null
                      ? (rule.estimated_value_cents / 100).toFixed(2).replace(".", ",")
                      : ""
                  }
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
                  defaultValue={rule.opportunity_note ?? ""}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Salvar alterações</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
