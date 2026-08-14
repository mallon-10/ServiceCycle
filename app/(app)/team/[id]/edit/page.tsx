import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTechnician, deleteTechnician } from "../../actions";
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
import { DeleteButton } from "@/components/app/delete-button";

export default async function EditTechnicianPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: technician } = await supabase
    .from("technicians")
    .select("id, name, specialty, phone, email")
    .eq("id", id)
    .single();

  if (!technician) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-start justify-between">
        <PageTitle>Editar técnico</PageTitle>
        <DeleteButton
          action={deleteTechnician}
          hiddenFields={{ id: technician.id }}
          confirmMessage={`Excluir ${technician.name}? Essa ação não pode ser desfeita.`}
        >
          Excluir
        </DeleteButton>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do técnico</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateTechnician} className="space-y-4">
            <input type="hidden" name="id" value={technician.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={technician.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                name="specialty"
                defaultValue={technician.specialty ?? ""}
                placeholder="Ex: Climatização, Geradores"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={technician.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={technician.email ?? ""}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Salvar alterações</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
