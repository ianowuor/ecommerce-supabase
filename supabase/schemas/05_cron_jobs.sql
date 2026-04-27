-- Midnight Cleanup
select cron.schedule('cleanup-old-orders', '0 0 * * *',
  $$ update public.orders set status = 'cancelled' where status = 'pending' and created_at < now() - interval '24 hours' $$
);

-- Hourly Expiry Check
select cron.schedule('reset-featured-products', '0 * * * *', 
  $$ update public.products set is_featured = false where expiry_date < now() $$
);

-- Daily Flash Sale
select cron.schedule('flash-sale-timer', '0 0 * * *', 'select handle_daily_flash_sale()');