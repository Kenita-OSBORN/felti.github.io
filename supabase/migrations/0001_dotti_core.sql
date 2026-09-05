create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'registered' check (role in ('registered', 'vip', 'admin')),
  membership_status text not null default 'None' check (membership_status in ('None', 'Active', 'Cancelled', 'Expired')),
  avatar_url text,
  phone text,
  birthday date,
  bio text,
  shipping_address jsonb not null default '{}'::jsonb,
  subscription_start timestamptz,
  subscription_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  design_json jsonb not null,
  preview_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('base', 'decoration', 'avatar', 'background')),
  storage_path text not null,
  public_url text,
  content_type text not null,
  size integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null unique,
  items_json jsonb not null,
  address_json jsonb not null,
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  vip_discount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed', 'Refunded')),
  order_status text not null default 'Pending' check (order_status in ('Pending', 'Confirmed', 'Making', 'Ready', 'Shipped', 'Delivered', 'Cancelled')),
  tracking_company text,
  tracking_number text,
  created_at timestamptz not null default now()
);

create index if not exists idx_designs_user_updated on public.designs(user_id, updated_at desc);
create index if not exists idx_uploads_user_created on public.uploads(user_id, created_at desc);
create index if not exists idx_cart_items_user_created on public.cart_items(user_id, created_at asc);
create index if not exists idx_orders_user_created on public.orders(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.designs enable row level security;
alter table public.uploads enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;

create policy "profiles own select" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
create policy "designs own all" on public.designs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "uploads own all" on public.uploads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart own all" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders own select" on public.orders for select using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('dotti-uploads', 'dotti-uploads', false)
on conflict (id) do update set public = excluded.public;

create policy "upload owner insert" on storage.objects
for insert with check (bucket_id = 'dotti-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "upload owner select" on storage.objects
for select using (bucket_id = 'dotti-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "upload owner update" on storage.objects
for update using (bucket_id = 'dotti-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "upload owner delete" on storage.objects
for delete using (bucket_id = 'dotti-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
