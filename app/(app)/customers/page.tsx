import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBox } from "@/components/ui/search-box";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/ui/typography";
import { LinkText } from "@/components/ui/link-text";

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("id, name, phone, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: customers, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Clientes</PageTitle>
          <p className="text-sm text-muted-foreground">
            Empresas ou pessoas donas dos ativos que você gerencia.
          </p>
        </div>
        <Link href="/customers/new" className={buttonVariants()}>
          Novo cliente
        </Link>
      </div>

      <SearchBox placeholder="Buscar por nome..." />

      {!customers || customers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {q ? (
              "Nenhum cliente encontrado para essa busca."
            ) : (
              <>
                Nenhum cliente cadastrado ainda.{" "}
                <LinkText href="/customers/new">Cadastre o primeiro</LinkText>.
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <LinkText href={`/customers/${customer.id}`}>
                          {customer.name}
                        </LinkText>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.email ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            buildHref={(p) =>
              `/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`
            }
          />
        </>
      )}
    </div>
  );
}
