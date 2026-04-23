CREATE OR REPLACE FUNCTION public.place_order(
  p_shipping_address text,
  p_total_amount numeric,
  p_payment_method text DEFAULT 'credit_card' -- Add this parameter
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Create the Order with payment_method
  INSERT INTO public.orders (user_id, total_amount, shipping_address, status, payment_method)
  VALUES (v_user_id, p_total_amount, p_shipping_address, 'pending', p_payment_method)
  RETURNING id INTO v_order_id;

  -- 2. Move Cart Items to Order Items
  INSERT INTO public.order_items (order_id, product_id, quantity, price)
  SELECT 
    v_order_id, 
    c.product_id, 
    c.quantity, 
    p.price
  FROM public.cart_items c
  JOIN public.products p ON c.product_id = p.id
  WHERE c.user_id = v_user_id;

  -- 3. Clear the User's Cart
  DELETE FROM public.cart_items 
  WHERE user_id = v_user_id;

  RETURN json_build_object('id', v_order_id);
END;
$$;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'credit_card';