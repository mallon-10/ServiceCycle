-- Field technicians: cadastro-only records the admin manages and assigns
-- work to. No login of their own (no auth.users link) — that's a deliberate
-- scope decision, not an oversight; see plan discussion for context.

create table public.technicians (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  specialty text,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_technicians_tenant on public.technicians (tenant_id);

alter table public.technicians enable row level security;

create policy "technicians_select" on public.technicians
  for select using (tenant_id = public.current_tenant_id());
create policy "technicians_insert" on public.technicians
  for insert with check (tenant_id = public.current_tenant_id());
create policy "technicians_update" on public.technicians
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create policy "technicians_delete" on public.technicians
  for delete using (tenant_id = public.current_tenant_id());
