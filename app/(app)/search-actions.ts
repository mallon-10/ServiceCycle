"use server";

import { createClient } from "@/lib/supabase/server";

export type GlobalSearchResult = {
  type: "customer" | "asset" | "opportunity";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  if (query.trim().length < 2) return [];

  const supabase = await createClient();
  const needle = `%${query}%`;

  const [customersRes, assetsRes] = await Promise.all([
    supabase.from("customers").select("id, name").ilike("name", needle).limit(5),
    supabase
      .from("assets")
      .select("id, name, serial_number, customers(name)")
      .or(`name.ilike.${needle},serial_number.ilike.${needle}`)
      .limit(5),
  ]);

  const results: GlobalSearchResult[] = [];

  for (const c of customersRes.data ?? []) {
    results.push({
      type: "customer",
      id: c.id,
      title: c.name,
      subtitle: "Cliente",
      href: `/customers/${c.id}`,
    });
  }

  for (const a of assetsRes.data ?? []) {
    const customerName = (a.customers as { name: string } | null)?.name;
    results.push({
      type: "asset",
      id: a.id,
      title: a.name,
      subtitle: [customerName, a.serial_number].filter(Boolean).join(" · ") || "Ativo",
      href: `/assets/${a.id}`,
    });
  }

  return results;
}
