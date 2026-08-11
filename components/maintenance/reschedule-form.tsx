"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RescheduleForm({
  action,
  eventId,
  assetId,
  currentDate,
}: {
  action: (formData: FormData) => void;
  eventId: string;
  assetId: string;
  currentDate: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Reagendar
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="asset_id" value={assetId} />
      <Input
        type="date"
        name="scheduled_date"
        defaultValue={currentDate}
        className="h-7 w-auto"
        required
      />
      <Button type="submit" size="sm">
        Confirmar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}
