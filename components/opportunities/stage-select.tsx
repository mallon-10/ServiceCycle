"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STAGE_LABELS: Record<string, string> = {
  generated: "Gerada",
  in_contact: "Em contato",
  won: "Ganha",
  lost: "Perdida",
};

export function StageSelect({
  action,
  eventId,
  stage,
}: {
  action: (formData: FormData) => void;
  eventId: string;
  stage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={stage}
      disabled={isPending}
      onValueChange={(value) => {
        const formData = new FormData();
        formData.set("event_id", eventId);
        formData.set("stage", value as string);
        startTransition(() => action(formData));
      }}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STAGE_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
