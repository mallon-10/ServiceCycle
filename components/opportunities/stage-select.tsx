"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const STAGE_LABELS: Record<string, string> = {
  detected: "Detectada",
  ready: "Pronta para ação",
  sent_to_crm: "Enviada ao CRM",
  negotiating: "Em negociação",
  approved: "Aprovada",
  scheduled: "Agendada",
  executed: "Executada",
  new_cycle_started: "Novo ciclo iniciado",
  ignored: "Ignorada",
  no_interest: "Sem interesse",
  cancelled: "Cancelada",
  postponed: "Adiada",
};

const STAGE_ORDER = [
  "detected", "ready", "sent_to_crm", "negotiating", "approved",
  "scheduled", "executed", "new_cycle_started",
  "ignored", "no_interest", "cancelled", "postponed",
];

export function StageSelect({
  action,
  opportunityId,
  stage,
}: {
  action: (formData: FormData) => void;
  opportunityId: string;
  stage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={stage}
      disabled={isPending}
      onValueChange={(value) => {
        const formData = new FormData();
        formData.set("opportunity_id", opportunityId);
        formData.set("stage", value as string);
        startTransition(() => action(formData));
      }}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGE_ORDER.map((value) => (
          <SelectItem key={value} value={value}>
            {STAGE_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
