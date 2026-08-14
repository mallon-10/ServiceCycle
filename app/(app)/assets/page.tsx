import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
import { MaintenanceStatusBadge } from "@/components/maintenance/status-badge";
import { findAssetCategory } from "@/lib/catalog/asset-categories";

const PAGE_SIZE = 20;

export default async function AssetsPage({
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
    .from("assets")
    .select("id, name, category, category_slug, customers(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: assets, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const assetIds = (assets ?? []).map((a) => a.id);
  const nextDateByAsset = new Map<string, string>();

  if (assetIds.length > 0) {
    const { data: events } = await supabase
      .from("cycle_events")
      .select("asset_id, scheduled_date")
      .in("asset_id", assetIds)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: true });

    for (const event of events ?? []) {
      if (!nextDateByAsset.has(event.asset_id)) {
        nextDateByAsset.set(event.asset_id, event.scheduled_date);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Ativos</PageTitle>
        <p className="text-sm text-muted-foreground">
          Todos os equipamentos monitorados, de todos os clientes.
        </p>
      </div>

      <SearchBox placeholder="Buscar por nome do ativo..." />

      {!assets || assets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {q
              ? "Nenhum ativo encontrado para essa busca."
              : "Nenhum ativo cadastrado ainda. Cadastre um cliente e adicione o primeiro ativo dele."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Próxima manutenção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const customerName = (
                      asset.customers as { name: string } | null
                    )?.name;
                    const nextDate = nextDateByAsset.get(asset.id) ?? null;
                    const categoryInfo = findAssetCategory(asset.category_slug);

                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          {categoryInfo && (
                            <div className="relative size-10 overflow-hidden rounded-md">
                              <Image
                                src={categoryInfo.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <LinkText href={`/assets/${asset.id}`}>
                            {asset.name}
                          </LinkText>
                        </TableCell>
                        <TableCell>
                          {asset.category ? (
                            <Badge variant="secondary">{asset.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customerName ?? "—"}
                        </TableCell>
                        <TableCell>
                          <MaintenanceStatusBadge nextDate={nextDate} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            buildHref={(p) =>
              `/assets?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`
            }
          />
        </>
      )}
    </div>
  );
}
