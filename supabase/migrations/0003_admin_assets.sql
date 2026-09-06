create table if not exists public.admin_assets (
  id text primary key,
  asset_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_assets enable row level security;

drop policy if exists "admin assets public select" on public.admin_assets;
create policy "admin assets public select" on public.admin_assets
for select using (active = true);
