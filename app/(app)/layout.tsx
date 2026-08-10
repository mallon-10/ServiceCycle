import Link from "next/link";
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

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/customers", label: "Clientes" },
    { href: "/assets", label: "Ativos" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-primary">
              ServiceCycle
            </Link>
            <NavLinks items={navItems} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {tenantName ?? profile?.full_name ?? user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
