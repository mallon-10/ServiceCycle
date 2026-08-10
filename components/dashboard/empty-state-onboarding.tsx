import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/typography";

const STEPS = [
  {
    title: "Cadastre um cliente",
    description: "A empresa ou pessoa dona do equipamento.",
  },
  {
    title: "Adicione um ativo dele",
    description:
      "Escolha a categoria — as regras de manutenção já vêm prontas, sem precisar digitar intervalo nenhum.",
  },
  {
    title: "Pronto",
    description:
      "O ServiceCycle avisa aqui, no dashboard, quando alguma manutenção estiver vencendo — automaticamente.",
  },
];

export function EmptyStateOnboarding() {
  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Bem-vindo ao ServiceCycle</PageTitle>
        <p className="text-sm text-muted-foreground">
          Nunca mais perca uma manutenção preventiva ou uma oportunidade de
          pós-venda. Veja como começar:
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <Card key={step.title}>
            <CardContent className="py-4">
              <div className="mb-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {i + 1}
              </div>
              <div className="font-medium">{step.title}</div>
              <div className="text-sm text-muted-foreground">
                {step.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/customers/new" className={buttonVariants()}>
        Cadastrar primeiro cliente
      </Link>
    </div>
  );
}
