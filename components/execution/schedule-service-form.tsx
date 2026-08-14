"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ScheduleServiceForm({
  action,
  cycleEventId,
  defaultDate,
  technicians,
}: {
  action: (formData: FormData) => void;
  cycleEventId: string;
  defaultDate: string;
  technicians: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Agendar
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="cycle_event_id" value={cycleEventId} />
      <Input
        type="date"
        name="scheduled_date"
        defaultValue={defaultDate}
        className="h-8 w-auto"
        required
      />
      <Select name="technician_id">
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Técnico" />
        </SelectTrigger>
        <SelectContent>
          {technicians.map((tech) => (
            <SelectItem key={tech.id} value={tech.id}>
              {tech.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm">
        Confirmar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}
