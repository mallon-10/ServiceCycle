-- Links assets to a fixed catalog of categories (lib/catalog/asset-categories.ts).
-- The catalog lives in code, not the database, so no FK/check constraint here —
-- validation of the slug against the catalog happens in the Server Action.

alter table public.assets add column category_slug text;

comment on column public.assets.category_slug is
  'Slug into the code-defined catalog at lib/catalog/asset-categories.ts. Nullable for assets created before the catalog existed or with a free-form/"outro" category.';
