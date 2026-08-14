import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toggleTechnicianActive } from "./actions";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: technicians } = await supabase
    .from("technicians")
    .select("id, name, specialty, phone, email, active")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Equipe</PageTitle>
          <p className="text-sm text-muted-foreground">
            Técnicos disponíveis para atribuir a manutenções e visitas.
          </p>
        </div>
        <Link href="/team/new" className={buttonVariants()}>
          Novo técnico
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      {!technicians || technicians.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum técnico cadastrado ainda.{" "}
            <LinkText href="/team/new">Cadastre o primeiro</LinkText>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {technicians.map((tech) => (
            <Card key={tech.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {initials(tech.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <LinkText href={`/team/${tech.id}/edit`}>{tech.name}</LinkText>
                    <div className="truncate text-sm text-muted-foreground">
                      {tech.specialty ?? "Sem especialidade definida"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{tech.phone ?? tech.email ?? "—"}</span>
                  <form action={toggleTechnicianActive}>
                    <input type="hidden" name="id" value={tech.id} />
                    <input type="hidden" name="active" value={String(tech.active)} />
                    <button type="submit">
                      <Badge
                        variant={tech.active ? "default" : "secondary"}
                        className="cursor-pointer"
                      >
                        {tech.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
