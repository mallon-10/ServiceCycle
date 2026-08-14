import { createClient } from "@/lib/supabase/server";
import { createCycleTemplate } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function NewCycleTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("asset_categories")
    .select("id, label")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageTitle>Novo ciclo</PageTitle>
      <Card>
        <CardHeader>
          <CardTitle>Dados do ciclo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCycleTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Compressor Atlas GA22"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria (opcional)</Label>
              <Select name="category_id">
                <SelectTrigger id="category_id" className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante (opcional)</Label>
                <Input id="manufacturer" name="manufacturer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo (opcional)</Label>
                <Input id="model" name="model" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Salvar ciclo</Button>
            <p className="text-xs text-muted-foreground">
              Depois de salvar, você adiciona os eventos (troca de óleo,
              revisão, etc.) dentro do ciclo.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
