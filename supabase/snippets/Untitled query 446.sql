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