"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  "Climatização",
  "Energia solar",
  "Geradores",
  "Elevadores",
  "Compressores",
  "Sistemas contra incêndio",
  "Máquinas industriais",
  "Outro",
];

const ENTRY_METHODS = [
  { value: "manual", label: "Cadastrar manualmente", description: "Comece pelo primeiro cliente e ativo agora mesmo." },
  { value: "import", label: "Importar planilha", description: "Em breve — por enquanto, cadastre manualmente." },
  { value: "integration", label: "Integração", description: "Conecte seu ERP/CRM em Integrações depois." },
  { value: "later", label: "Configurar depois", description: "Explore o produto primeiro, cadastre quando quiser." },
];

export function EmptyStateOnboarding() {
  const [step, setStep] = useState(1);
  const [segment, setSegment] = useState<string | null>(null);

  if (step === 1) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <PageTitle>Como sua empresa trabalha?</PageTitle>
          <p className="text-sm text-muted-foreground">
            Passo 1 de 4 — isso ajuda a sugerir categorias e ciclos relevantes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SEGMENTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSegment(s);
                setStep(2);
              }}
              className={cn(
                "rounded-lg border border-border p-4 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/40",
                segment === s && "border-primary bg-accent/40"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <PageTitle>Como seus ativos entrarão no ServiceCycle?</PageTitle>
          <p className="text-sm text-muted-foreground">Passo 2 de 4</p>
        </div>
        <div className="space-y-2">
          {ENTRY_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setStep(3)}
              className="block w-full rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="font-medium">{m.label}</div>
              <div className="text-sm text-muted-foreground">{m.description}</div>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
          ← Voltar
        </Button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <PageTitle>Crie seu primeiro Ciclo</PageTitle>
          <p className="text-sm text-muted-foreground">
            Passo 3 de 4 — configure uma vez, use em todo equipamento
            semelhante.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-2 py-4 text-sm">
            <div className="font-medium">Exemplo</div>
            <div className="text-muted-foreground">
              {segment ?? "Equipamento"} · Preventiva · a cada 6 meses ·
              começar contato 30 dias antes · R$ 850 em potencial
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Link
            href="/cycles/templates/new"
            className={buttonVariants()}
            onClick={() => setStep(4)}
          >
            Criar primeiro ciclo
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setStep(4)}>
            Pular por agora
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <PageTitle>Pronto</PageTitle>
        <p className="text-sm text-muted-foreground">
          O ServiceCycle começa a monitorar assim que você cadastrar o
          primeiro cliente e ativo. Configure uma vez e deixe o sistema
          trabalhar.
        </p>
      </div>
      <Link href="/customers/new" className={buttonVariants()}>
        Cadastrar primeiro cliente
      </Link>
    </div>
  );
}
