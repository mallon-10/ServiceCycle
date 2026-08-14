"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChecklistItem = { id: string; description: string };

export function CompleteEventForm({
  action,
  eventId,
  assetId,
  checklistItems,
}: {
  action: (formData: FormData) => void;
  eventId: string;
  assetId: string;
  checklistItems: ChecklistItem[];
}) {
  const [open, setOpen] = useState(false);

  if (checklistItems.length === 0) {
    return (
      <form action={action}>
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="asset_id" value={assetId} />
        <Button type="submit" size="sm">
          Marcar como executada
        </Button>
      </form>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Marcar como executada
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="w-full space-y-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="asset_id" value={assetId} />
      <div className="space-y-1.5">
        {checklistItems.map((item) => (
          <label key={item.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="checked_item"
              value={item.id}
              className="mt-0.5 size-3.5 rounded border-input"
            />
            {item.description}
          </label>
        ))}
      </div>
      <Textarea
        name="completion_notes"
        placeholder="Observações (opcional)"
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Confirmar execução
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
