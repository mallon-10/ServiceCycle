-- Moves the asset category catalog from code (lib/catalog/asset-categories.ts)
-- into the database. Global/shared across tenants — same catalog everyone
-- sees today, just no longer requiring a deploy to change.
--
-- Deliberately NOT adding a FK from assets.category_slug to this table yet:
-- production may hold category_slug values that predate this catalog (rows
-- created before 0002, or free-text edge cases). Adding a FK here could fail
-- the migration on unknown data. That constraint is a follow-up migration
-- once the data is confirmed clean.

create table public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.asset_categories is
  'Global catalog, not tenant-scoped — same categories shown to every tenant, matching the current hardcoded behavior in lib/catalog/asset-categories.ts.';

alter table public.asset_categories enable row level security;

create policy "asset_categories_select" on public.asset_categories
  for select using (auth.uid() is not null);

insert into public.asset_categories (slug, label, image_url, sort_order) values
  ('climatizacao', 'Climatização', 'https://images.unsplash.com/photo-1631545806609-42a7e6ec5db3?auto=format&fit=crop&w=640&h=400&q=80', 0),
  ('energia-solar', 'Painéis solares', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=640&h=400&q=80', 1),
  ('gerador', 'Gerador', 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=640&h=400&q=80', 2),
  ('nobreak', 'Nobreak', 'https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=640&h=400&q=80', 3),
  ('incendio', 'Sistema contra incêndio / extintores', 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=640&h=400&q=80', 4),
  ('bomba-hidraulica', 'Bomba hidráulica', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=640&h=400&q=80', 5),
  ('elevador', 'Elevador', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=640&h=400&q=80', 6),
  ('portao-automatico', 'Portão automático', 'https://images.unsplash.com/photo-1580377968103-3b9a5dbb0329?auto=format&fit=crop&w=640&h=400&q=80', 7),
  ('compressor', 'Compressor', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&h=400&q=80', 8),
  ('outro', 'Outro', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=640&h=400&q=80', 9);
