type TimelineEntry = {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, i) => (
        <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < entries.length - 1 && (
            <span className="absolute left-[5px] top-3 h-full w-px bg-border" />
          )}
          <span className="relative mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-sm">{entry.description}</div>
            <div className="text-xs text-muted-foreground">
              {formatTimestamp(entry.created_at)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
