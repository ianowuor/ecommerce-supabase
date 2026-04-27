drop policy "Users can delete their own cart" on "public"."cart_items";

drop policy "Users can insert their own cart" on "public"."cart_items";

drop policy "Users can update their own cart" on "public"."cart_items";

drop policy "Users can view their own cart" on "public"."cart_items";


  create policy "Users can manage their own cart"
  on "public"."cart_items"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Authenticated users can upload images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'product-images'::text) AND (auth.role() = 'authenticated'::text)));



