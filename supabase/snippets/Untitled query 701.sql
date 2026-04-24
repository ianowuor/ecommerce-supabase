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