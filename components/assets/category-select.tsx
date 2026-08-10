"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ASSET_CATEGORIES, findAssetCategory } from "@/lib/catalog/asset-categories";

export function CategorySelect() {
  const [slug, setSlug] = useState<string>("");
  const category = findAssetCategory(slug);

  return (
    <div className="space-y-2">
      <Label htmlFor="category_slug">Categoria</Label>
      <input type="hidden" name="category_slug" value={slug} />
      <Select value={slug} onValueChange={(value) => setSlug(value as string)}>
        <SelectTrigger id="category_slug" className="w-full">
          <SelectValue placeholder="Selecione o tipo de ativo">
            {(value: string | null) => findAssetCategory(value ?? undefined)?.label ?? "Selecione o tipo de ativo"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ASSET_CATEGORIES.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {category && category.rules.length > 0 && (
        <Card className="bg-muted/40">
          <CardContent className="py-3 text-sm text-muted-foreground">
            Este tipo de ativo já vem com {category.rules.length}{" "}
            {category.rules.length === 1 ? "regra" : "regras"} de manutenção
            configurada{category.rules.length === 1 ? "" : "s"} automaticamente:{" "}
            {category.rules
              .map((r) => `${r.name} (a cada ${r.intervalDays} dias)`)
              .join(", ")}
            .
          </CardContent>
        </Card>
      )}

      {category && category.rules.length === 0 && slug !== "" && (
        <p className="text-xs text-muted-foreground">
          Esse tipo não tem regra padrão — você pode adicionar manualmente
          depois de salvar o ativo.
        </p>
      )}
    </div>
  );
}
