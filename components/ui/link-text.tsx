import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Link> & {
  variant?: "primary" | "subtle";
};

export function LinkText({ variant = "primary", className, ...props }: Props) {
  return (
    <Link
      className={cn(
        "underline-offset-4 hover:underline",
        variant === "primary"
          ? "font-medium text-link"
          : "text-sm text-muted-foreground hover:text-link",
        className
      )}
      {...props}
    />
  );
}
