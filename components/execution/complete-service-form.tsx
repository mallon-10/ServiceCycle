"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CompleteServiceForm({
  action,
  serviceId,
}: {
  action: (formData: FormData) => void;
  serviceId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Marcar como executado
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-3"
    >
      <input type="hidden" name="service_id" value={serviceId} />
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
