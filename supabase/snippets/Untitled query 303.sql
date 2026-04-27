-- 1. Ensure the bucket is actually flagged as 'public' in the DB
update storage.buckets 
set public = true 
where id = 'product-images';

-- 2. Drop any old policies that might be interfering
drop policy if exists "Public Access" on storage.objects;

-- 3. Create a bulletproof select policy for the Storage API
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'product-images' );