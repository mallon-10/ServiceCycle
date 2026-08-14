"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Wrench,
  RefreshCw,
  ClipboardList,
  Users,
  HardHat,
  Map,
  Plug,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/assets", label: "Ativos", icon: Wrench },
  { href: "/cycles", label: "Ciclos", icon: RefreshCw },
  { href: "/execution", label: "Execução", icon: ClipboardList },
];

const SECONDARY_NAV_ITEMS = [
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/team", label: "Equipe", icon: HardHat },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} />
      {label}
    </Link>
  );
}

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}
      </div>
      <div className="flex flex-col gap-0.5 border-t border-sidebar-border pt-3">
        {SECONDARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}
