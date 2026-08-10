/**
 * Fixed catalog of asset categories with default maintenance rules.
 * Interval values are plausible industry reference points (same order of
 * magnitude as the briefing's own example: filter swap at 180 days), not
 * numbers validated by a domain specialist — see cerebro/oferta.md.
 */

export type MaintenanceRuleTemplate = {
  name: string;
  intervalDays: number;
};

export type AssetCategory = {
  slug: string;
  label: string;
  rules: MaintenanceRuleTemplate[];
};

export const ASSET_CATEGORIES: AssetCategory[] = [
  {
    slug: "climatizacao",
    label: "Climatização",
    rules: [
      { name: "Troca de filtro", intervalDays: 180 },
      { name: "Higienização e revisão geral", intervalDays: 365 },
    ],
  },
  {
    slug: "energia-solar",
    label: "Painéis solares",
    rules: [
      { name: "Limpeza dos painéis", intervalDays: 180 },
      { name: "Inspeção do inversor", intervalDays: 365 },
    ],
  },
  {
    slug: "gerador",
    label: "Gerador",
    rules: [
      { name: "Troca de óleo", intervalDays: 180 },
      { name: "Teste de carga", intervalDays: 90 },
    ],
  },
  {
    slug: "nobreak",
    label: "Nobreak",
    rules: [{ name: "Verificação da bateria", intervalDays: 180 }],
  },
  {
    slug: "incendio",
    label: "Sistema contra incêndio / extintores",
    rules: [{ name: "Inspeção e recarga", intervalDays: 365 }],
  },
  {
    slug: "bomba-hidraulica",
    label: "Bomba hidráulica",
    rules: [{ name: "Revisão de vedação e rolamentos", intervalDays: 180 }],
  },
  {
    slug: "elevador",
    label: "Elevador",
    rules: [{ name: "Manutenção preventiva mensal", intervalDays: 30 }],
  },
  {
    slug: "portao-automatico",
    label: "Portão automático",
    rules: [{ name: "Lubrificação e revisão de motor", intervalDays: 180 }],
  },
  {
    slug: "compressor",
    label: "Compressor",
    rules: [{ name: "Troca de óleo e filtro", intervalDays: 180 }],
  },
  {
    // No default rules — falls back to the manual rule-creation flow.
    slug: "outro",
    label: "Outro",
    rules: [],
  },
];

export function findAssetCategory(slug: string | null | undefined) {
  return ASSET_CATEGORIES.find((c) => c.slug === slug);
}
