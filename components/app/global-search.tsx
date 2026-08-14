"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearch, type GlobalSearchResult } from "@/app/(app)/search-actions";

const ICONS = { customer: Users, asset: Wrench, opportunity: Search };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await globalSearch(value);
        setResults(r);
        setOpen(true);
      });
    }, 250);
  }

  function selectResult(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-sm">
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar cliente, ativo, número de série..."
      />
      {open && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum resultado para &quot;{query}&quot;.
            </div>
          ) : (
            results.map((r) => {
              const Icon = ICONS[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  onMouseDown={() => selectResult(r.href)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.subtitle}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
