import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateAsset } from "../../actions";
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

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select(
      "id, name, category, manufacturer, model, serial_number, install_date, warranty_expires_at, location, notes"
    )
    .eq("id", id)
    .single();

  if (!asset) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <PageTitle>Editar ativo</PageTitle>
        {asset.category && (
          <p className="text-sm text-muted-foreground">
            Categoria: {asset.category} (não pode ser alterada depois de
            criado o ativo)
          </p>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAsset} className="space-y-6">
            <input type="hidden" name="id" value={asset.id} />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome / identificação</Label>
                <Input id="name" name="name" required defaultValue={asset.name} />
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    defaultValue={asset.manufacturer ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" name="model" defaultValue={asset.model ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Número de série</Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  defaultValue={asset.serial_number ?? ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="install_date">Data de instalação</Label>
                  <Input
                    id="install_date"
                    name="install_date"
                    type="date"
                    defaultValue={asset.install_date ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty_expires_at">Garantia até</Label>
                  <Input
                    id="warranty_expires_at"
                    name="warranty_expires_at"
                    type="date"
                    defaultValue={asset.warranty_expires_at ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={asset.location ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" defaultValue={asset.notes ?? ""} />
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
