create extension if not exists "pg_cron" with schema "pg_catalog";


  create table "public"."cart_items" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "quantity" integer not null default 1,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."cart_items" enable row level security;


  create table "public"."job_queue" (
    "id" uuid not null default gen_random_uuid(),
    "job_type" text not null,
    "payload" jsonb,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "product_id" uuid,
    "quantity" integer not null default 1,
    "price" numeric(10,2) not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."order_items" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "total_amount" numeric(10,2) not null,
    "status" text default 'pending'::text,
    "payment_method" text default 'credit_card'::text,
    "shipping_address" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "price" numeric(10,2) not null,
    "image_url" text,
    "shopify_id" text,
    "shopify_variant_id" text,
    "shopify_inventory_item_id" text,
    "is_featured" boolean default false,
    "is_on_sale" boolean default false,
    "expiry_date" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."products" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "full_name" text not null,
    "phone" text,
    "address" text,
    "avatar_url" text
      );


CREATE UNIQUE INDEX cart_items_pkey ON public.cart_items USING btree (id);

CREATE UNIQUE INDEX cart_items_user_id_product_id_key ON public.cart_items USING btree (user_id, product_id);

CREATE UNIQUE INDEX job_queue_pkey ON public.job_queue USING btree (id);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX products_shopify_id_key ON public.products USING btree (shopify_id);

CREATE UNIQUE INDEX products_shopify_variant_id_key ON public.products USING btree (shopify_variant_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."cart_items" add constraint "cart_items_pkey" PRIMARY KEY using index "cart_items_pkey";

alter table "public"."job_queue" add constraint "job_queue_pkey" PRIMARY KEY using index "job_queue_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."cart_items" add constraint "cart_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_product_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_quantity_check" CHECK ((quantity >= 1)) not valid;

alter table "public"."cart_items" validate constraint "cart_items_quantity_check";

alter table "public"."cart_items" add constraint "cart_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_user_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_user_id_product_id_key" UNIQUE using index "cart_items_user_id_product_id_key";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_items" add constraint "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_product_id_fkey";

alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey";

alter table "public"."products" add constraint "products_shopify_id_key" UNIQUE using index "products_shopify_id_key";

alter table "public"."products" add constraint "products_shopify_variant_id_key" UNIQUE using index "products_shopify_variant_id_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_daily_flash_sale()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.products set is_on_sale = false;
  update public.products set is_on_sale = true
  where id in (select id from public.products order by random() limit 3);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_order_email()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  perform net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/send-order-email',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_shopify_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  perform net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/shopify-sync',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.place_order(p_shipping_address text, p_total_amount numeric, p_payment_method text DEFAULT 'credit_card'::text)
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
$function$
;

grant delete on table "public"."cart_items" to "anon";

grant insert on table "public"."cart_items" to "anon";

grant references on table "public"."cart_items" to "anon";

grant select on table "public"."cart_items" to "anon";

grant trigger on table "public"."cart_items" to "anon";

grant truncate on table "public"."cart_items" to "anon";

grant update on table "public"."cart_items" to "anon";

grant delete on table "public"."cart_items" to "authenticated";

grant insert on table "public"."cart_items" to "authenticated";

grant references on table "public"."cart_items" to "authenticated";

grant select on table "public"."cart_items" to "authenticated";

grant trigger on table "public"."cart_items" to "authenticated";

grant truncate on table "public"."cart_items" to "authenticated";

grant update on table "public"."cart_items" to "authenticated";

grant delete on table "public"."cart_items" to "service_role";

grant insert on table "public"."cart_items" to "service_role";

grant references on table "public"."cart_items" to "service_role";

grant select on table "public"."cart_items" to "service_role";

grant trigger on table "public"."cart_items" to "service_role";

grant truncate on table "public"."cart_items" to "service_role";

grant update on table "public"."cart_items" to "service_role";

grant delete on table "public"."job_queue" to "anon";

grant insert on table "public"."job_queue" to "anon";

grant references on table "public"."job_queue" to "anon";

grant select on table "public"."job_queue" to "anon";

grant trigger on table "public"."job_queue" to "anon";

grant truncate on table "public"."job_queue" to "anon";

grant update on table "public"."job_queue" to "anon";

grant delete on table "public"."job_queue" to "authenticated";

grant insert on table "public"."job_queue" to "authenticated";

grant references on table "public"."job_queue" to "authenticated";

grant select on table "public"."job_queue" to "authenticated";

grant trigger on table "public"."job_queue" to "authenticated";

grant truncate on table "public"."job_queue" to "authenticated";

grant update on table "public"."job_queue" to "authenticated";

grant delete on table "public"."job_queue" to "service_role";

grant insert on table "public"."job_queue" to "service_role";

grant references on table "public"."job_queue" to "service_role";

grant select on table "public"."job_queue" to "service_role";

grant trigger on table "public"."job_queue" to "service_role";

grant truncate on table "public"."job_queue" to "service_role";

grant update on table "public"."job_queue" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


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



  create policy "Users can view their own order items"
  on "public"."order_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));



  create policy "Anyone can view products"
  on "public"."products"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER on_order_created AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_order_email();

CREATE TRIGGER on_product_created AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_shopify_sync();


  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'product-images'::text));



