UPDATE public.products
SET image_url = REPLACE(image_url, '/product-images/public/', '/product-images/')
WHERE image_url LIKE '%/product-images/public/%';