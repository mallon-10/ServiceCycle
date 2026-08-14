"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNASSIGNED = "__unassigned__";

export function TechnicianSelect({
  action,
  eventId,
  technicianId,
  technicians,
}: {
  action: (formData: FormData) => void;
  eventId: string;
  technicianId: string | null;
  technicians: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={technicianId ?? UNASSIGNED}
      disabled={isPending}
      onValueChange={(value) => {
        const formData = new FormData();
        formData.set("event_id", eventId);
        formData.set(
          "technician_id",
          value === UNASSIGNED ? "" : (value as string)
        );
        startTransition(() => action(formData));
      }}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Sem técnico" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Sem técnico</SelectItem>
        {technicians.map((tech) => (
          <SelectItem key={tech.id} value={tech.id}>
            {tech.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
