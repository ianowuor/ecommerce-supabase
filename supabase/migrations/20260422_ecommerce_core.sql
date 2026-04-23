-- 1. EXTENSIONS
create extension if not exists "pg_cron";
create extension if not exists "pg_net"; 

-- 2. TABLES
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
  expiry_date timestamptz, -- Changed to timestamptz for consistency
  created_at timestamptz default now()
);

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  total_amount numeric(10, 2) not null,
  status text default 'pending',
  shipping_address text not null, -- FIXED: Removed the stray 'w'
  created_at timestamptz default now() -- FIXED: Ensured preceding comma exists
);

create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  price numeric(10, 2) not null, -- Stores the price at the time of purchase
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.order_items enable row level security;

-- Allow users to view their own order items
create policy "Users can view their own order items" 
  on public.order_items for select 
  using (
    exists (
      select 1 from public.orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid()
    )
  );

create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 3. SECURITY & RLS
alter table public.cart_items enable row level security;
alter table public.products enable row level security;

create policy "Users can view their own cart" on public.cart_items for select using (auth.uid() = user_id);
create policy "Users can insert their own cart" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own cart" on public.cart_items for update using (auth.uid() = user_id);
create policy "Users can delete their own cart" on public.cart_items for delete using (auth.uid() = user_id);
create policy "Anyone can view products" on public.products for select using (true);

-- 4. STORAGE
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 5. FUNCTIONS & TRIGGERS
-- Note: triggers must call a FUNCTION. We wrap the http_request in a function.

create or replace function public.handle_shopify_sync() 
returns trigger as $$
begin
  perform net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/shopify-sync',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_product_created
  after insert on public.products
  for each row execute function public.handle_shopify_sync();

create or replace function public.handle_order_email() 
returns trigger as $$
begin
  perform net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/send-order-email',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_order_created
  after insert on public.orders
  for each row execute function public.handle_order_email();

-- 6. CRON JOBS
-- Wrap logic in $$ to avoid escaping issues
select cron.schedule(
  'cleanup-old-orders',
  '0 0 * * *',
  $$ update public.orders set status = 'cancelled' where status = 'pending' and created_at < now() - interval '24 hours' $$
);

select cron.schedule(
  'reset-featured-products',
  '0 * * * *', 
  $$ update public.products set is_featured = false where expiry_date < now() $$
);