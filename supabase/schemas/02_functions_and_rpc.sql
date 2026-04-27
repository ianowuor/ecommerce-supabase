-- RPC for Placing Orders (Atomic Transaction)
create or replace function public.place_order(
  p_shipping_address text,
  p_total_amount numeric,
  p_payment_method text default 'credit_card'
)
returns json
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- 1. Create the Order
  insert into public.orders (user_id, total_amount, shipping_address, status, payment_method)
  values (v_user_id, p_total_amount, p_shipping_address, 'pending', p_payment_method)
  returning id into v_order_id;

  -- 2. Move Cart Items to Order Items
  insert into public.order_items (order_id, product_id, quantity, price)
  select v_order_id, c.product_id, c.quantity, p.price
  from public.cart_items c
  join public.products p on c.product_id = p.id
  where c.user_id = v_user_id;

  -- 3. Add to Job Queue
  insert into public.job_queue (job_type, payload) 
  values ('check_inventory', json_build_object('order_id', v_order_id));

  -- 4. Clear the User's Cart
  delete from public.cart_items where user_id = v_user_id;

  return json_build_object('id', v_order_id);
end;
$$;

-- Flash Sale Logic
create or replace function handle_daily_flash_sale()
returns void as $$
begin
  update public.products set is_on_sale = false;
  update public.products set is_on_sale = true
  where id in (select id from public.products order by random() limit 3);
end;
$$ language plpgsql;