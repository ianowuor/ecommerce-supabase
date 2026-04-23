/* src/app/cart/page.tsx */
"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Breadcrumb from "@/components/common/Breadcrumbs";
import { addToCart, getCartItems, type CartItem } from "@/lib/api";
import { supabase } from "@/lib/supabase"; // Import supabase client

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartUpdateError, setCartUpdateError] = useState<string | null>(null);

  const reload = async () => {
    setCartUpdateError(null);
    try {
      const data = await getCartItems();
      setCartItems(data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const removeFromCart = async (productId: string) => {
    setCartUpdateError(null);
    try {
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("product_id", productId);
      
      if (deleteError) throw deleteError;
      await reload();
    } catch (e) {
      setCartUpdateError((e as Error).message ?? "Failed to remove item from cart");
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartUpdateError(null);
    try {
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("product_id", productId);

      if (updateError) throw updateError;
      await reload();
    } catch (e) {
      setCartUpdateError((e as Error).message ?? "Failed to update cart");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await reload();
      } catch (e) {
        setError((e as Error).message ?? "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = Number(item.product?.price ?? 0);
      return acc + price * item.quantity;
    }, 0);
  }, [cartItems]);

  return (
    <div className="max-w-[1170px] mx-auto px-4 xl:px-0 mb-[140px]">
      <Breadcrumb items={[{ label: "Cart", href: "/cart" }]} />

      <div className="hidden md:grid grid-cols-4 shadow-sm rounded-[4px] py-[24px] px-[40px] mb-[40px] font-medium">
        <span>Product</span>
        <span className="text-center">Price</span>
        <span className="text-center">Quantity</span>
        <span className="text-right">Subtotal</span>
      </div>

      {(error || cartUpdateError) && (
        <div className="py-4 px-6 bg-red-50 text-red-600 rounded-md mb-6">
          {error || cartUpdateError}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center">Loading cart...</div>
      ) : cartItems.length === 0 ? (
        <div className="py-20 text-center flex flex-col gap-6">
           <p className="text-gray-500">Your cart is empty</p>
           <Link href="/shop" className="text-[#DB4444] font-medium underline">Go Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[40px] mb-[24px]">
        {cartItems.map((item) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 items-center shadow-sm rounded-[4px] py-[24px] px-[40px] relative group">
            <div className="flex items-center gap-5">
               <div className="relative w-[54px] h-[54px]">
                  <Image
                    src={item.product?.image_url || "/images/placeholder.png"}
                    alt={item.product?.name ?? "Product"}
                    fill
                    sizes="100px"
                    className="object-contain"
                    unoptimized={process.env.NODE_ENV === 'development'}
                  />
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    className="absolute -top-2 -left-2 bg-[#DB4444] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
               </div>
               <span className="font-medium">{item.product?.name ?? "Unknown product"}</span>
            </div>

            <div className="text-center hidden md:block">${Number(item.product?.price ?? 0).toFixed(0)}</div>

            <div className="flex justify-center">
              <div className="flex items-center border border-black/30 rounded-[4px] px-3 py-1 gap-4">
                <span className="w-6 text-center">{item.quantity}</span>
                <div className="flex flex-col">
                  <ChevronUp
                    className="w-4 h-4 cursor-pointer hover:text-[#DB4444]"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  />
                  <ChevronDown
                    className="w-4 h-4 cursor-pointer hover:text-[#DB4444]"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  />
                </div>
              </div>
            </div>

            <div className="text-right font-medium hidden md:block">
              ${(Number(item.product?.price ?? 0) * item.quantity).toFixed(0)}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Rest of UI stays identical... */}
      <div className="flex justify-between mb-[80px]">
        <Link href="/shop" className="border border-black/50 px-[48px] py-[16px] rounded-[4px] font-medium hover:bg-black hover:text-white transition-all">
          Return To Shop
        </Link>
        <button 
          onClick={reload}
          className="border border-black/50 px-[48px] py-[16px] rounded-[4px] font-medium hover:bg-black hover:text-white transition-all"
        >
          Update Cart
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-10 items-start">
        <div className="flex gap-4 w-full lg:w-auto">
          <input type="text" placeholder="Coupon Code" className="border border-black rounded-[4px] px-[24px] py-[16px] w-full lg:w-[300px] outline-none" />
          <button className="bg-[#DB4444] text-white px-[48px] py-[16px] rounded-[4px] font-medium">Apply Coupon</button>
        </div>

        <div className="border-2 border-black rounded-[4px] p-[32px] w-full lg:w-[470px]">
          <h3 className="text-[20px] font-medium mb-[24px]">Cart Total</h3>
          <div className="flex justify-between pb-4 border-b border-black/30 mb-4">
            <span>Subtotal:</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between pb-4 border-b border-black/30 mb-4">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between mb-[32px]">
            <span>Total:</span>
            <span className="font-bold">${subtotal}</span>
          </div>
          <div className="flex justify-center">
            <Link href="/checkout" className="bg-[#DB4444] text-white px-[48px] py-[16px] rounded-[4px] font-medium text-center w-full">
              Proceed to checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}