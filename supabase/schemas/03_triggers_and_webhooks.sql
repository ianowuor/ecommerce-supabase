create or replace function public.handle_shopify_sync() 
returns trigger as $$
begin
  perform net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/shopify-sync',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_product_created
  after insert on public.products
  for each row execute function public.handle_shopify_sync();

create or replace function public.handle_order_email() 
returns trigger as $$
begin
  perform net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/send-order-email',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_order_created
  after insert on public.orders
  for each row execute function public.handle_order_email();