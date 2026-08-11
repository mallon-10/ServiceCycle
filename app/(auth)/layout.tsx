export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            SC
          </div>
          <span className="font-heading text-base font-semibold tracking-tight text-sidebar-foreground">
            ServiceCycle
          </span>
        </div>
        <div className="max-w-md">
          <p className="text-2xl font-medium leading-snug text-sidebar-foreground">
            Nunca mais perca uma manutenção preventiva ou uma oportunidade de
            pós-venda.
          </p>
          <p className="mt-3 text-sm text-sidebar-foreground/60">
            A camada de recorrência e pós-venda para empresas que vendem ou
            instalam equipamentos com manutenção periódica.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/40">
          ServiceCycle · Gestão do ciclo de vida de ativos
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
