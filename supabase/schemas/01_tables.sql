-- Extensions
create extension if not exists "pg_cron";
create extension if not exists "pg_net"; 

-- Tables
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text,
  address text,
  avatar_url text
);

create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  shopify_id text unique,
  shopify_variant_id text unique,
  shopify_inventory_item_id text,
  is_featured boolean default false,
  is_on_sale boolean default false,
  expiry_date timestamptz,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  total_amount numeric(10, 2) not null,
  status text default 'pending',
  payment_method text default 'credit_card',
  shipping_address text not null,
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  price numeric(10, 2) not null,
  created_at timestamptz default now()
);

create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

create table public.job_queue (
  id uuid default gen_random_uuid() primary key,
  job_type text not null,
  payload jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);