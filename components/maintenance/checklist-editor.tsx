"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ChecklistEditor({
  initialItems = [],
}: {
  initialItems?: string[];
}) {
  const [items, setItems] = useState<string[]>(
    initialItems.length > 0 ? initialItems : [""]
  );

  return (
    <div className="space-y-2">
      <Label>Checklist de execução (opcional)</Label>
      <p className="text-xs text-muted-foreground">
        Itens que o técnico marca ao concluir essa manutenção. Aparecem na
        Ordem de Serviço em PDF.
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              name="item"
              defaultValue={item}
              placeholder="Ex: Verificar nível de óleo"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setItems((prev) => [...prev, ""])}
      >
        <Plus className="size-3.5" />
        Adicionar item
      </Button>
    </div>
  );
}
