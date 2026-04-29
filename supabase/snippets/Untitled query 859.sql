-- First, ensure the table is empty if you want a clean start (Optional)
-- TRUNCATE public.products RESTART IDENTITY CASCADE;

INSERT INTO public.products (name, description, price, image_url)
VALUES
  ('Premium Suede Bag', 'Luxurious and durable suede duffle bag for travel or daily use.', 120, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/bag.png'),
  ('Canon DSLR Camera', 'Professional grade digital camera for high-quality photography and video.', 950, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/camera.png'),
  ('Ergonomic Office Chair', 'High-back swivel chair designed for maximum comfort during long work hours.', 250, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/chair.png'),
  ('Professional Soccer Cleats', 'High-performance cleats designed for superior grip and speed on the field.', 85, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/cleats.png'),
  ('Winter Puffer Coat', 'Insulated winter coat to keep you warm in the harshest conditions.', 320, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/coat.png'),
  ('RGB CPU Cooler', 'Advanced liquid cooling system with customizable RGB lighting for your PC.', 65, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/cooler.png'),
  ('Curology Skincare Set', 'Personalized dermatological skincare routine for a clear and healthy glow.', 40, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/curology.png'),
  ('Nutritional Dog Food', 'High-protein dry dog food formulated for all breeds and life stages.', 35, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/dog-food.jpg'),
  ('DualSense Wireless Controller', 'Next-gen haptic feedback and adaptive triggers for immersive gaming.', 70, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/gamepad.png'),
  ('iPhone 15 Pro', 'The latest Apple smartphone with titanium design and A17 Pro chip.', 999, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/iphone.jpg'),
  ('Quilted Bomber Jacket', 'Stylish quilted jacket perfect for casual outings and layering.', 150, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/jacket.png'),
  ('JBL Flip 6 Speaker', 'Powerful, portable Bluetooth speaker with waterproof and dustproof design.', 110, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/jbl-speaker.png'),
  ('Mechanical Gaming Keyboard', 'Tactile mechanical switches with backlit keys for the ultimate gaming experience.', 140, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/keyboard.png'),
  ('MacBook Pro M3', 'Incredible performance and battery life with the latest M3 chip architecture.', 1999, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/laptop.png'),
  ('Apple Studio Display', '27-inch 5K Retina display with 12MP camera and six-speaker sound system.', 1599, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/monitor.png'),
  ('Gucci Bloom Perfume', 'A sophisticated floral fragrance designed for the modern woman.', 130, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/perfume.png'),
  ('PlayStation 5 Console', 'Experience lightning-fast loading and a whole new generation of incredible games.', 499, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/ps5.png'),
  ('Minimalist Wall Shelf', 'Sleek wooden floating shelf for a clean and organized home aesthetic.', 45, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/shelf.png'),
  ('Studio Monitor Speakers', 'High-fidelity audio monitors for professional music production and mixing.', 299, 'http://127.0.0.1:54321/storage/v1/object/public/product-images/speakers.png');