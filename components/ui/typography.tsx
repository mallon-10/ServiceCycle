import { cn } from "@/lib/utils";

export function PageTitle({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("text-2xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function SectionLabel({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  );
}

export function Muted({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}
