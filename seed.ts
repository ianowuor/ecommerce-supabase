/* seed-products.ts */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const imagesPath = path.join(process.env.HOME || '', 'Downloads', 'images');

const productsToSeed = [
  { name: "Suede Duffle Bag", file: "bag.png", price: 120, description: "Premium travel bag" },
  { name: "Canon DSLR Camera", file: "camera.png", price: 950, description: "Professional photography" },
  { name: "Comfort Swivel Chair", file: "chair.png", price: 250, description: "Ergonomic office chair" },
  { name: "Soccer Cleats", file: "cleats.png", price: 80, description: "High-grip field shoes" },
  { name: "North Face Winter Coat", file: "coat.png", price: 320, description: "Heavy duty winter protection" },
  { name: "RGB PC Cooler", file: "cooler.png", price: 45, description: "High-performance liquid cooling" },
  { name: "Curology Skincare Set", file: "curology.png", price: 65, description: "Personalized skin care" },
  { name: "Pedigree Dry Dog Food", file: "dog-food.jpg", price: 35, description: "Nutritious meal for dogs" },
  { name: "DualSense Wireless Controller", file: "gamepad.png", price: 70, description: "Haptic feedback controller" },
  { name: "Apple iPhone 15 Pro", file: "iphone.jpg", price: 999, description: "Latest flagship smartphone" },
  { name: "Quilted Puffer Jacket", file: "jacket.png", price: 150, description: "Stylish and warm" },
  { name: "JBL Flip 6 Speaker", file: "jbl-speaker.png", price: 110, description: "Portable waterproof speaker" },
  { name: "Mechanical Gaming Keyboard", file: "keyboard.png", price: 140, description: "Tactile blue switches" },
  { name: "MacBook Pro M3", file: "laptop.png", price: 1999, description: "Power for professionals" },
  { name: "Apple Studio Display", file: "monitor.png", price: 1599, description: "5K Retina display" },
  { name: "Gucci Bloom Perfume", file: "perfume.png", price: 130, description: "Floral luxury fragrance" },
  { name: "PlayStation 5 Console", file: "ps5.png", price: 499, description: "Next-gen gaming" },
  { name: "Floating Wall Shelf", file: "shelf.png", price: 55, description: "Minimalist wooden shelf" }
];

async function seed() {
  console.log("🚀 Starting seed process...");

  for (const item of productsToSeed) {
    const filePath = path.join(imagesPath, item.file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Skipping ${item.file}: File not found in Downloads/images`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`public/${item.file}`, fileBuffer, {
        contentType: item.file.endsWith('.png') ? 'image/png' : 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ Error uploading ${item.file}:`, uploadError.message);
      continue;
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`public/${item.file}`);

    // 3. Insert into Database (Trimmed to match your schema)
    const { error: dbError } = await supabase
      .from('products')
      .upsert({
        name: item.name,
        price: item.price,
        description: item.description,
        image_url: urlData.publicUrl
      }, { onConflict: 'name' });

    if (dbError) {
      console.error(`❌ Error inserting ${item.name}:`, dbError.message);
    } else {
      console.log(`✅ Successfully seeded: ${item.name}`);
    }
  }

  console.log("🏁 Seeding complete!");
}

seed();