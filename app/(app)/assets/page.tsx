import Link from "next/link";
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
import { todayDateString, upcomingThresholdDateString } from "@/lib/maintenance/scheduling";

const PAGE_SIZE = 20;

function MaintenanceStatusBadge({
  nextDate,
  today,
  threshold,
}: {
  nextDate: string | null;
  today: string;
  threshold: string;
}) {
  if (!nextDate) {
    return <Badge variant="secondary">Sem manutenção agendada</Badge>;
  }
  if (nextDate < today) {
    return <Badge variant="destructive">Vencida</Badge>;
  }
  if (nextDate <= threshold) {
    return <Badge variant="default">Vencendo</Badge>;
  }
  return <Badge variant="outline">Em dia</Badge>;
}

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
  const today = todayDateString();
  const threshold = upcomingThresholdDateString();

  let query = supabase
    .from("assets")
    .select("id, name, category, customers(name)", { count: "exact" })
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
      .from("maintenance_events")
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
        <h1 className="text-2xl font-semibold">Ativos</h1>
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

                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <Link
                            href={`/assets/${asset.id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {asset.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {asset.category ? (
                            <Badge variant="outline">{asset.category}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{customerName ?? "—"}</TableCell>
                        <TableCell>
                          <MaintenanceStatusBadge
                            nextDate={nextDate}
                            today={today}
                            threshold={threshold}
                          />
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
