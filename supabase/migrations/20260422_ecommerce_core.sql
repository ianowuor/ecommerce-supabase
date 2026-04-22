-- 1. EXTENSIONS
create extension if not exists "pg_cron";
create extension if not exists "pg_net"; -- REQUIRED for webhooks/http requests

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
  is_featured boolean default false, -- Added this to fix cron error
  expiry_date timestamptz,            -- Added this to fix cron error
  created_at timestamptz default now()
);

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  total_amount numeric(10, 2) not null,
  status text default 'pending',
  shipping_address text not null,
  created_at timestamptz default now()
);

-- 1. Create the cart_items table
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz default now(),
  
  -- This mirrors your SQLAlchemy UniqueConstraint("user_id", "product_id")
  unique(user_id, product_id)
);

-- 2. Enable RLS
alter table public.cart_items enable row level security;

-- 3. Policies
-- Users can only see their own cart items
create policy "Users can view their own cart" 
  on public.cart_items for select 
  using (auth.uid() = user_id);

-- Users can only insert their own cart items
create policy "Users can insert their own cart" 
  on public.cart_items for insert 
  with check (auth.uid() = user_id);

-- Users can only update their own cart items
create policy "Users can update their own cart" 
  on public.cart_items for update 
  using (auth.uid() = user_id);

-- Users can only delete their own cart items
create policy "Users can delete their own cart" 
  on public.cart_items for delete 
  using (auth.uid() = user_id);

-- 3. STORAGE (Storage setup is usually done via API, but if using SQL, ensure bucket exists)
-- Note: Insert into storage.buckets usually needs to happen after storage extension is ready
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 4. TRIGGERS (Fixed syntax)

-- Fix for on_product_created
create trigger on_product_created
  after insert on public.products
  for each row
  execute function supabase_functions.http_request(
    'http://host.docker.internal:54321/functions/v1/shopify-sync',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}'
  );

-- Already correct on_order_created
create trigger on_order_created
  after insert on public.orders
  for each row
  execute function supabase_functions.http_request(
    'http://host.docker.internal:54321/functions/v1/send-order-email',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}'
  );

-- 5. RLS POLICIES
alter table public.products enable row level security;
create policy "Anyone can view products" on public.products for select using (true);

-- 6. CRON JOBS
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