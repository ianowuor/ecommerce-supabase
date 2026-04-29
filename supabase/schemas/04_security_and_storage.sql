-- 1. EXTENSIONS (Required for Storage to function properly)
create extension if not exists "uuid-ossp";

SET search_path = public, storage;

-- 2. BUCKET CREATION
-- We use a DO block to ensure the bucket is created if it doesn't exist
-- This is the "mechanical" way to ensure Supabase recognizes the bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 
  'product-images', 
  true, 
  5242880, -- 5MB limit
  '{image/png,image/jpeg,image/webp}'
)
on conflict (id) do update set public = true;

-- 3. TABLE SECURITY
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

-- 4. PUBLIC POLICIES
create policy "Anyone can view products" on public.products for select using (true);
create policy "Users can view their own cart" on public.cart_items for select using (auth.uid() = user_id);
create policy "Users can insert their own cart" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own cart" on public.cart_items for update using (auth.uid() = user_id);
create policy "Users can delete their own cart" on public.cart_items for delete using (auth.uid() = user_id);

create policy "Users can view their own order items" on public.order_items for select 
using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));

CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- 5. STORAGE POLICIES
-- Drop existing to avoid conflicts during reorganization
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;

-- Allow anyone to view images in this specific bucket
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'product-images' );

-- Allow authenticated users (like you in the dashboard or app) to upload
create policy "Authenticated Upload" 
on storage.objects for insert 
with check (
  bucket_id = 'product-images' 
  and auth.role() = 'authenticated'
);