import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function PaginationControls({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
