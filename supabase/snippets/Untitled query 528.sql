UPDATE public.products 
SET image_url = REPLACE(image_url, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/', '');