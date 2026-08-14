"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchBox } from "@/components/ui/search-box";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STAGE_LABELS } from "@/components/opportunities/stage-select";

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
  { value: "overdue", label: "Atrasadas" },
];

const PRIORITIES = [
  { value: "critical", label: "Crítica" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
];

export function RadarPeriodFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPeriod(period: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (period === "all") {
      params.delete("period");
    } else {
      params.set("period", period);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => setPeriod("all")}
        className={cn(
          "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
          !current
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Todas
      </button>
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => setPeriod(p.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
            current === p.value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function QuerySelect({
  paramKey,
  placeholder,
  options,
}: {
  paramKey: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get(paramKey) ?? "";

  return (
    <Select
      value={current || "__all__"}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "__all__") {
          params.delete(paramKey);
        } else {
          params.set(paramKey, value as string);
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
    >
      <SelectTrigger size="sm" className="w-auto min-w-32">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RadarFilterBar() {
  const stageOptions = Object.entries(STAGE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchBox placeholder="Buscar cliente, ativo, série..." />
      <QuerySelect paramKey="priority" placeholder="Prioridade" options={PRIORITIES} />
      <QuerySelect paramKey="stage" placeholder="Status" options={stageOptions} />
      <QuerySelect
        paramKey="crm"
        placeholder="CRM"
        options={[
          { value: "sent", label: "Enviada ao CRM" },
          { value: "not_sent", label: "Não enviada" },
        ]}
      />
    </div>
  );
}
