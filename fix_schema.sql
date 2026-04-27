drop function if exists "public"."place_order"(p_shipping_address text, p_total_amount numeric, p_payment_method text);

alter table "public"."orders" disable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.place_order(p_shipping_address text, p_total_amount numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_order_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- 1. Create the Order
  insert into public.orders (user_id, total_amount, shipping_address, status)
  values (v_user_id, p_total_amount, p_shipping_address, 'pending')
  returning id into v_order_id;

  -- 2. Move Cart Items to Order Items
  insert into public.order_items (order_id, product_id, quantity, price)
  select 
    v_order_id, 
    c.product_id, 
    c.quantity, 
    p.price
  from public.cart_items c
  join public.products p on c.product_id = p.id
  where c.user_id = v_user_id;

  -- 3. Clear the User's Cart
  delete from public.cart_items 
  where user_id = v_user_id;

  return json_build_object('id', v_order_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_daily_flash_sale()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  -- 1. Reset all products to NOT be on sale
  update public.products set is_on_sale = false;

  -- 2. Pick 3 random products and set them to ON sale
  update public.products 
  set is_on_sale = true
  where id in (
    select id from public.products 
    order by random() 
    limit 3
  );
end;
$function$
;



