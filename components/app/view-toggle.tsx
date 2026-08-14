"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { List, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewToggle({ current }: { current: "list" | "calendar" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: "list" | "calendar") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-border p-0.5">
      <button
        type="button"
        onClick={() => setView("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
          current === "list"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="size-3.5" />
        Lista
      </button>
      <button
        type="button"
        onClick={() => setView("calendar")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
          current === "calendar"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarDays className="size-3.5" />
        Calendário
      </button>
    </div>
  );
}
