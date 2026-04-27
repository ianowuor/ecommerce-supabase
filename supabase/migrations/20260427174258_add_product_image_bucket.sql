drop policy "Users can manage their own cart" on "public"."cart_items";


  create policy "Users can delete their own cart"
  on "public"."cart_items"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own cart"
  on "public"."cart_items"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own cart"
  on "public"."cart_items"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own cart"
  on "public"."cart_items"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


drop policy "Authenticated users can upload images" on "storage"."objects";


  create policy "Authenticated Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'product-images'::text) AND (auth.role() = 'authenticated'::text)));



