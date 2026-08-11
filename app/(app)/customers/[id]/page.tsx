import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCustomer } from "../actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";
import { DeleteButton } from "@/components/app/delete-button";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, document, phone, email, address")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const { data: assets } = await supabase
    .from("assets")
    .select("id, name, category, manufacturer, model")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <LinkText href="/customers" variant="subtle">
            ← Clientes
          </LinkText>
          <PageTitle>{customer.name}</PageTitle>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          <DeleteButton
            action={deleteCustomer}
            hiddenFields={{ id: customer.id }}
            confirmMessage={`Excluir ${customer.name}? Essa ação não pode ser desfeita.`}
          >
            Excluir
          </DeleteButton>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <div className="space-y-3">
        <SectionLabel>Dados do cliente</SectionLabel>
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm">
            <div>
              <div className="text-muted-foreground">CNPJ/CPF</div>
              <div>{customer.document ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Telefone</div>
              <div>{customer.phone ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">E-mail</div>
              <div>{customer.email ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Endereço</div>
              <div>{customer.address ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Ativos</SectionLabel>
          <Link
            href={`/assets/new?customer_id=${customer.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            Novo ativo
          </Link>
        </div>

        {!assets || assets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum ativo cadastrado para este cliente ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {assets.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`}>
                <Card className="transition-colors hover:border-primary/40 hover:bg-accent/40">
                  <CardContent className="py-4">
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[asset.category, asset.manufacturer, asset.model]
                        .filter(Boolean)
                        .join(" · ") || "Sem detalhes adicionais"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
