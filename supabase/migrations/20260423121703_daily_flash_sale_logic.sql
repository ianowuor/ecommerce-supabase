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


-- Using a 'jobs' table to simulate a queue
CREATE TABLE public.job_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type text NOT NULL,
  payload jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Update the place_order RPC to add a job to the queue
-- Add this line inside your place_order function:
-- INSERT INTO public.job_queue (job_type, payload) VALUES ('check_inventory', json_build_object('order_id', v_order_id));

-- Enable the extension
create extension if not exists pg_cron;

-- Schedule a task to run every day at midnight
SELECT cron.schedule(
  'cancel-abandoned-orders', -- name of the job
  '0 0 * * *',               -- cron syntax (Midnight every day)
  $$ 
    UPDATE public.orders 
    SET status = 'cancelled' 
    WHERE status = 'pending' 
    AND created_at < now() - interval '24 hours'
  $$
);