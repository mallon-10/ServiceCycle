import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/app/nav-links";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, tenants(name)")
    .eq("id", user.id)
    .single();

  const tenantName = (profile?.tenants as { name: string } | null)?.name;
  const displayName = profile?.full_name ?? user.email ?? "";
  const initial = (tenantName ?? displayName).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            SC
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
            ServiceCycle
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-1 py-1.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {initial || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-foreground">
                {tenantName ?? displayName}
              </div>
              {tenantName && (
                <div className="truncate text-xs text-sidebar-foreground/60">
                  {displayName}
                </div>
              )}
            </div>
          </div>
          <form action={signOut} className="mt-1">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-60">
        <main className="flex-1 px-8 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
