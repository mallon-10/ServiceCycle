"use client";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  hiddenFields,
  confirmMessage,
  children,
}: {
  action: (formData: FormData) => void;
  hiddenFields: Record<string, string>;
  confirmMessage: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="destructive" size="sm">
        {children}
      </Button>
    </form>
  );
}
