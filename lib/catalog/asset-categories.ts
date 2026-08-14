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
  /**
   * Illustrative placeholder photo (not the customer's actual equipment) —
   * same image for every asset in the category until real upload exists.
   */
  imageUrl: string;
};

const UNSPLASH_PARAMS = "auto=format&fit=crop&w=640&h=400&q=80";

export const ASSET_CATEGORIES: AssetCategory[] = [
  {
    slug: "climatizacao",
    label: "Climatização",
    rules: [
      { name: "Troca de filtro", intervalDays: 180 },
      { name: "Higienização e revisão geral", intervalDays: 365 },
    ],
    imageUrl: `https://images.unsplash.com/photo-1631545806609-42a7e6ec5db3?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "energia-solar",
    label: "Painéis solares",
    rules: [
      { name: "Limpeza dos painéis", intervalDays: 180 },
      { name: "Inspeção do inversor", intervalDays: 365 },
    ],
    imageUrl: `https://images.unsplash.com/photo-1509391366360-2e959784a276?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "gerador",
    label: "Gerador",
    rules: [
      { name: "Troca de óleo", intervalDays: 180 },
      { name: "Teste de carga", intervalDays: 90 },
    ],
    imageUrl: `https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "nobreak",
    label: "Nobreak",
    rules: [{ name: "Verificação da bateria", intervalDays: 180 }],
    imageUrl: `https://images.unsplash.com/photo-1591405351990-4726e331f141?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "incendio",
    label: "Sistema contra incêndio / extintores",
    rules: [{ name: "Inspeção e recarga", intervalDays: 365 }],
    imageUrl: `https://images.unsplash.com/photo-1600607686527-6fb886090705?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "bomba-hidraulica",
    label: "Bomba hidráulica",
    rules: [{ name: "Revisão de vedação e rolamentos", intervalDays: 180 }],
    imageUrl: `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "elevador",
    label: "Elevador",
    rules: [{ name: "Manutenção preventiva mensal", intervalDays: 30 }],
    imageUrl: `https://images.unsplash.com/photo-1567016432779-094069958ea5?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "portao-automatico",
    label: "Portão automático",
    rules: [{ name: "Lubrificação e revisão de motor", intervalDays: 180 }],
    imageUrl: `https://images.unsplash.com/photo-1580377968103-3b9a5dbb0329?${UNSPLASH_PARAMS}`,
  },
  {
    slug: "compressor",
    label: "Compressor",
    rules: [{ name: "Troca de óleo e filtro", intervalDays: 180 }],
    imageUrl: `https://images.unsplash.com/photo-1581092160607-ee22621dd758?${UNSPLASH_PARAMS}`,
  },
  {
    // No default rules — falls back to the manual rule-creation flow.
    slug: "outro",
    label: "Outro",
    rules: [],
    imageUrl: `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?${UNSPLASH_PARAMS}`,
  },
];

export function findAssetCategory(slug: string | null | undefined) {
  return ASSET_CATEGORIES.find((c) => c.slug === slug);
}
