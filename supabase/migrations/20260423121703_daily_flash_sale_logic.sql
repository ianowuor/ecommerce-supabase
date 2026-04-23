-- Add a column to track sales if you haven't yet
alter table public.products add column if not exists is_on_sale boolean default false;

-- Create the function that the cron job will call
create or replace function handle_daily_flash_sale()
returns void as $$
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
$$ language plpgsql;


-- Schedule the job to run every day at midnight
-- Syntax: cron.schedule('job-name', 'schedule', 'command')
select cron.schedule(
  'flash-sale-timer',
  '0 0 * * *', 
  'select handle_daily_flash_sale()'
);