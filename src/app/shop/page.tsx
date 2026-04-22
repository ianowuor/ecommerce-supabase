/* src/app/shop/page.tsx */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import Breadcrumb from "@/components/common/Breadcrumbs";
import ProductCard from "@/components/ecommerce/ProductCard";
// Note: api.ts now handles Supabase logic internally
import { type Product, addToCart, getProducts } from "@/lib/api";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartAddError, setCartAddError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Using the refactored getProducts from api.ts
    getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message ?? "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-[1170px] mx-auto px-4 xl:px-0 mb-[140px]">
      <Breadcrumb items={[{ label: "Shop", href: "/shop" }]} />

      <div className="flex flex-col lg:flex-row gap-[30px] mt-10">

        {/* Left Sidebar: Filters */}
        <aside className="w-full lg:w-[270px] flex flex-col gap-10">
          {/* Category Filter */}
          <div>
            <h3 className="text-[20px] font-medium mb-6">Category</h3>
            <ul className="flex flex-col gap-4 text-[16px] opacity-70">
              <li className="hover:text-[#DB4444] cursor-pointer">Woman's Fashion</li>
              <li className="hover:text-[#DB4444] cursor-pointer">Men's Fashion</li>
              <li className="hover:text-[#DB4444] cursor-pointer">Electronics</li>
              <li className="hover:text-[#DB4444] cursor-pointer">Home & Lifestyle</li>
              <li className="hover:text-[#DB4444] cursor-pointer">Medicine</li>
            </ul>
          </div>

          {/* Price Filter */}
          <div>
            <h3 className="text-[20px] font-medium mb-6">Price Range</h3>
            <div className="flex flex-col gap-4">
              <input type="range" min="0" max="2000" className="accent-[#DB4444] cursor-pointer" />
              <div className="flex justify-between text-[14px] opacity-70">
                <span>$0</span>
                <span>$2000</span>
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="text-[20px] font-medium mb-6">Rating</h3>
            <div className="flex flex-col gap-4">
              {[5, 4, 3, 2, 1].map((star) => (
                <label key={star} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 accent-[#DB4444]" />
                  <span className="text-[16px] group-hover:text-[#DB4444]">{star} Stars</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content: Product Grid */}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-10">
            {/* You might want to dynamically update '36' with products.length later */}
            <h2 className="text-[20px] font-semibold">Showing 1–{products.length} of {products.length} results</h2>
            <select className="border border-black/10 rounded-[4px] p-2 outline-none text-[16px]">
              <option>Default sorting</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest Arrivals</option>
            </select>
          </div>

          {loading ? (
            <div className="py-10 text-center">Loading products...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : (
            <>
              {cartAddError && <div className="py-4 text-center text-red-600">{cartAddError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-[30px] gap-y-[60px]">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={Number(product.price)}
                    image={product.image_url ?? "/images/placeholder.png"}
                    onAddToCart={async () => {
                      setCartAddError(null);
                      try {
                        await addToCart(product.id, 1);
                        alert("Added to cart!");
                      } catch (e) {
                        setCartAddError((e as Error).message ?? "Failed to add to cart");
                      }
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="mt-[60px] flex justify-center gap-4">
            <button className="w-10 h-10 border border-black/10 rounded-[4px] hover:bg-[#DB4444] hover:text-white transition-all">1</button>
            <button className="w-10 h-10 border border-black/10 rounded-[4px] hover:bg-[#DB4444] hover:text-white transition-all">2</button>
            <button className="w-10 h-10 border border-black/10 rounded-[4px] hover:bg-[#DB4444] hover:text-white transition-all">3</button>
          </div>
        </div>

      </div>
    </div>
  );
}