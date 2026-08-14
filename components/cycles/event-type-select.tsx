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

export const EVENT_TYPE_LABELS: Record<string, string> = {
  preventive: "Manutenção preventiva",
  revision: "Revisão",
  inspection: "Inspeção",
  filter_change: "Troca de filtro",
  oil_change: "Troca de óleo",
  recharge: "Recarga",
  part_replacement: "Substituição de peça",
  renewal: "Renovação",
  calibration: "Calibração",
  warranty: "Garantia",
  technical_return: "Retorno técnico",
  preventive_visit: "Visita preventiva",
};

export function EventTypeSelect({
  defaultValue = "preventive",
}: {
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <Label htmlFor="event_type">Tipo de evento</Label>
      <input type="hidden" name="event_type" value={value} />
      <Select value={value} onValueChange={(v) => setValue(v as string)}>
        <SelectTrigger id="event_type" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(EVENT_TYPE_LABELS).map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
