create table if not exists public.products (
  id text primary key,
  product_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing (
  id text primary key,
  config_json jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.pricing enable row level security;

drop policy if exists "products public select" on public.products;
create policy "products public select" on public.products
for select using (active = true);

drop policy if exists "pricing public select" on public.pricing;
create policy "pricing public select" on public.pricing
for select using (true);
