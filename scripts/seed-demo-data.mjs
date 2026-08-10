// Dev-only: populates a tenant with demo customers/assets/maintenance rules
// so the app can be reviewed with realistic volume. Run with:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-data.mjs <tenant-owner-email>
//
// Uses the Supabase REST API directly (service_role, bypasses RLS) instead
// of importing app code, since this runs outside the Next.js runtime.

const SUPABASE_URL = "https://yaheqgehyphkbjhbklhi.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}
if (!targetEmail) {
  console.error("Usage: node scripts/seed-demo-data.mjs <tenant-owner-email>");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}), Prefer: "return=representation" },
  });
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function findTenantIdByEmail(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers });
  const { users } = await res.json();
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`No auth user found for ${email}`);

  const [profile] = await rest(`profiles?id=eq.${user.id}&select=tenant_id`);
  if (!profile) throw new Error(`No profile found for ${email}`);
  return profile.tenant_id;
}

// Mirrors lib/catalog/asset-categories.ts — kept in sync manually since this
// script runs outside the Next.js/TS module graph.
const ASSET_CATEGORIES = [
  { slug: "climatizacao", label: "Climatização", rules: [
    { name: "Troca de filtro", intervalDays: 180 },
    { name: "Higienização e revisão geral", intervalDays: 365 },
  ]},
  { slug: "energia-solar", label: "Painéis solares", rules: [
    { name: "Limpeza dos painéis", intervalDays: 180 },
    { name: "Inspeção do inversor", intervalDays: 365 },
  ]},
  { slug: "gerador", label: "Gerador", rules: [
    { name: "Troca de óleo", intervalDays: 180 },
    { name: "Teste de carga", intervalDays: 90 },
  ]},
  { slug: "nobreak", label: "Nobreak", rules: [{ name: "Verificação da bateria", intervalDays: 180 }] },
  { slug: "incendio", label: "Sistema contra incêndio / extintores", rules: [{ name: "Inspeção e recarga", intervalDays: 365 }] },
  { slug: "bomba-hidraulica", label: "Bomba hidráulica", rules: [{ name: "Revisão de vedação e rolamentos", intervalDays: 180 }] },
  { slug: "elevador", label: "Elevador", rules: [{ name: "Manutenção preventiva mensal", intervalDays: 30 }] },
  { slug: "portao-automatico", label: "Portão automático", rules: [{ name: "Lubrificação e revisão de motor", intervalDays: 180 }] },
  { slug: "compressor", label: "Compressor", rules: [{ name: "Troca de óleo e filtro", intervalDays: 180 }] },
];

const CUSTOMER_NAMES = [
  "Condomínio Vista Verde",
  "Indústria Metalúrgica Sul",
  "Clínica São Lucas",
  "Supermercado Bom Preço",
  "Hotel Costa Azul",
  "Distribuidora Norte Alimentos",
  "Shopping Praça Central",
  "Escola Técnica Horizonte",
  "Restaurante Sabor & Arte",
  "Academia Corpo em Forma",
  "Escritório Advocacia Ramos",
  "Fábrica de Móveis Bela Vista",
  "Posto de Combustível Rota 12",
  "Laboratório Análises Clínicas Vida",
  "Igreja Comunidade Esperança",
];

const ASSET_NAME_TEMPLATES = {
  climatizacao: ["Split", "Ar-condicionado central", "Fancoil"],
  "energia-solar": ["Sistema fotovoltaico", "Painel solar"],
  gerador: ["Gerador de emergência", "Gerador principal"],
  nobreak: ["Nobreak sala servidor", "Nobreak recepção"],
  incendio: ["Extintor corredor", "Sistema de sprinklers"],
  "bomba-hidraulica": ["Bomba d'água", "Bomba de recalque"],
  elevador: ["Elevador social", "Elevador de serviço"],
  "portao-automatico": ["Portão de entrada", "Portão da garagem"],
  compressor: ["Compressor de ar", "Compressor industrial"],
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInstallDate() {
  // Spread across the last ~6 months so rule intervals produce a realistic
  // mix of overdue / upcoming / far-future maintenance dates.
  const daysAgo = Math.floor(Math.random() * 180);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log(`Looking up tenant for ${targetEmail}...`);
  const tenantId = await findTenantIdByEmail(targetEmail);
  console.log(`Tenant: ${tenantId}`);

  console.log(`Creating ${CUSTOMER_NAMES.length} customers...`);
  const customers = await rest("customers", {
    method: "POST",
    body: JSON.stringify(
      CUSTOMER_NAMES.map((name) => ({ tenant_id: tenantId, name }))
    ),
  });
  console.log(`  ${customers.length} customers created.`);

  const TARGET_ASSET_COUNT = 50;
  let created = 0;

  for (let i = 0; i < TARGET_ASSET_COUNT; i++) {
    const customer = randomFrom(customers);
    const category = randomFrom(ASSET_CATEGORIES);
    const nameTemplate = randomFrom(ASSET_NAME_TEMPLATES[category.slug]);
    const installDate = randomInstallDate();

    const [asset] = await rest("assets", {
      method: "POST",
      body: JSON.stringify([
        {
          tenant_id: tenantId,
          customer_id: customer.id,
          name: `${nameTemplate} ${i + 1}`,
          category: category.label,
          category_slug: category.slug,
          install_date: installDate,
        },
      ]),
    });

    for (const rule of category.rules) {
      const [createdRule] = await rest("maintenance_rules", {
        method: "POST",
        body: JSON.stringify([
          {
            tenant_id: tenantId,
            asset_id: asset.id,
            name: rule.name,
            interval_days: rule.intervalDays,
          },
        ]),
      });

      await rest("maintenance_events", {
        method: "POST",
        body: JSON.stringify([
          {
            tenant_id: tenantId,
            asset_id: asset.id,
            rule_id: createdRule.id,
            scheduled_date: addDays(installDate, rule.intervalDays),
            status: "scheduled",
          },
        ]),
      });
    }

    created++;
    if (created % 10 === 0) console.log(`  ${created}/${TARGET_ASSET_COUNT} assets created...`);
  }

  console.log(`Done. ${created} assets created with maintenance rules applied.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
