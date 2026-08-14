import { createClient } from "@/lib/supabase/server";
import { toggleIntegrationConnection } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle, SectionLabel } from "@/components/ui/typography";

type ProviderDef = { provider: string; category: "crm" | "erp" | "generic"; label: string };

const CRM_PROVIDERS: ProviderDef[] = [
  { provider: "salesforce", category: "crm", label: "Salesforce" },
  { provider: "hubspot", category: "crm", label: "HubSpot" },
  { provider: "pipedrive", category: "crm", label: "Pipedrive" },
  { provider: "rdstation", category: "crm", label: "RD Station CRM" },
];

const ERP_PROVIDERS: ProviderDef[] = [
  { provider: "erp_generic", category: "erp", label: "ERP (API / webhook / importação)" },
];

const GENERIC_PROVIDERS: ProviderDef[] = [
  { provider: "webhook", category: "generic", label: "Webhooks" },
  { provider: "zapier", category: "generic", label: "Zapier" },
  { provider: "make", category: "generic", label: "Make" },
  { provider: "n8n", category: "generic", label: "n8n" },
];

function ProviderCard({
  def,
  status,
}: {
  def: ProviderDef;
  status: string;
}) {
  const isConnected = status === "connected";
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <div className="font-medium">{def.label}</div>
          <Badge variant={isConnected ? "default" : "secondary"} className="mt-1">
            {isConnected ? "Conectado" : "Não conectado"}
          </Badge>
        </div>
        <form action={toggleIntegrationConnection}>
          <input type="hidden" name="provider" value={def.provider} />
          <input type="hidden" name="category" value={def.category} />
          <input type="hidden" name="current_status" value={status} />
          <Button type="submit" size="sm" variant={isConnected ? "outline" : "default"}>
            {isConnected ? "Desconectar" : "Configurar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: integrations } = await supabase
    .from("integrations")
    .select("provider, status");

  const statusByProvider = new Map(
    (integrations ?? []).map((i) => [i.provider, i.status])
  );

  return (
    <div className="space-y-8">
      <div>
        <PageTitle>Integrações</PageTitle>
        <p className="text-sm text-muted-foreground">
          O ServiceCycle não substitui seu CRM ou ERP — ele se conecta a
          eles. Quanto menos dado for redigitado, melhor.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
      )}

      <div className="space-y-3">
        <SectionLabel>CRM</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {CRM_PROVIDERS.map((def) => (
            <ProviderCard
              key={def.provider}
              def={def}
              status={statusByProvider.get(def.provider) ?? "not_connected"}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>ERP</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {ERP_PROVIDERS.map((def) => (
            <ProviderCard
              key={def.provider}
              def={def}
              status={statusByProvider.get(def.provider) ?? "not_connected"}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Integração genérica</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {GENERIC_PROVIDERS.map((def) => (
            <ProviderCard
              key={def.provider}
              def={def}
              status={statusByProvider.get(def.provider) ?? "not_connected"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
