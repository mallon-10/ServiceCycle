import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAsset } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelect } from "@/components/assets/category-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string; error?: string }>;
}) {
  const { customer_id: customerId, error } = await searchParams;

  if (!customerId) notFound();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("id", customerId)
    .single();

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo ativo</h1>
        <p className="text-sm text-muted-foreground">
          Vinculado ao cliente {customer.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAsset} className="space-y-4">
            <input type="hidden" name="customer_id" value={customer.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome / identificação</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Split Sala 2, Gerador Loja Centro"
              />
            </div>
            <CategorySelect />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input id="manufacturer" name="manufacturer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" name="model" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Número de série</Label>
              <Input id="serial_number" name="serial_number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="install_date">Data de instalação</Label>
                <Input id="install_date" name="install_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expires_at">Garantia até</Label>
                <Input
                  id="warranty_expires_at"
                  name="warranty_expires_at"
                  type="date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" name="location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Salvar ativo</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
