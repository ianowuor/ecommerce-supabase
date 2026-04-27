-- Add this if you haven't already
CREATE POLICY "Users can insert their own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order items" 
ON public.order_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);