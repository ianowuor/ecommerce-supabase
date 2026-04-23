"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/common/Breadcrumbs";
import { getCartItems, createOrder, type CartItem } from "@/lib/api";
import { supabase } from "@/lib/supabase";
//import { getAccessToken } from "@/lib/auth";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    streetAddress: "",
    apartment: "",
    city: "",
    phone: "",
    email: "",
    saveInfo: false,
    paymentMethod: "bank",
    couponCode: ""
  });

  useEffect(() => {
    const loadCart = async () => {
      // FIX: Check Supabase session instead of getAccessToken()
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No session found, redirecting to login");
        router.push("/login");
        return;
      }

      try {
        const items = await getCartItems();
        setCartItems(items);
      } catch (err) {
        console.error("Failed to load cart:", err);
        setError(err instanceof Error ? err.message : "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [router]);

  // Updated to ensure we use the correct price field from the backend
  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.product?.price ?? 0);
    return acc + price * item.quantity;
  }, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!formData.streetAddress || !formData.city || !formData.phone || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const shippingAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}`;
      
      const order = await createOrder({
  shipping_address: shippingAddress,
  total_amount: subtotal, // Pass the calculated subtotal here
});

      // Success! Clear state and redirect
      router.push(`/order-success?orderId=${order.id}`);
    } catch (err) {
      console.error("Checkout error:", err);
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          setError("Network error. Please check if the backend is running and CORS is configured.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to place order. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1170px] mx-auto px-4 xl:px-0 py-20">
        <div className="text-center">Loading checkout...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-[1170px] mx-auto px-4 xl:px-0 mb-[140px]">
        <Breadcrumb items={[{ label: "Cart", href: "/cart" }, { label: "Check-out", href: "/checkout" }]} />

        <h1 className="text-[36px] font-medium leading-[48px] tracking-[4%] mb-[48px]">Billing Details</h1>

        <div className="flex flex-col lg:flex-row gap-[100px] items-start">
          
          {/* Left Side: Billing Form */}
          <div className="flex-grow w-full lg:max-w-[470px] flex flex-col gap-[32px]">
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">First Name<span className="text-[#DB4444]">*</span></label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none focus:ring-1 ring-[#DB4444]" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">Company Name</label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">Street Address<span className="text-[#DB4444]">*</span></label>
              <input 
                type="text" 
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">Apartment, floor, etc. (optional)</label>
              <input 
                type="text" 
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">Town/City<span className="text-[#DB4444]">*</span></label>
              <input 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">Phone Number<span className="text-[#DB4444]">*</span></label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-black/50 text-[16px]">Email Address<span className="text-[#DB4444]">*</span></label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-[#F5F5F5] rounded-[4px] h-[50px] px-4 outline-none" 
                required 
              />
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <input 
                type="checkbox" 
                id="save-info" 
                name="saveInfo"
                checked={formData.saveInfo}
                onChange={handleInputChange}
                className="w-6 h-6 accent-[#DB4444]" 
              />
              <label htmlFor="save-info" className="text-[16px] cursor-pointer">Save this information for faster check-out next time</label>
            </div>
          </div>

          {/* Right Side: Order Summary */}
          <div className="w-full lg:w-[527px] pt-8 bg-white p-6 rounded-md shadow-sm border border-gray-100">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-100 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-8 mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative w-[54px] h-[54px]">
                      <Image 
                        src={item.product?.image_url || "/images/placeholder.png"} 
                        alt={item.product?.name || "Product"} 
                        fill
                        className="object-contain" 
                        unoptimized={process.env.NODE_ENV === 'development'}
                      />
                    </div>
                    <div>
                      <span className="text-[16px] font-medium">{item.product?.name}</span>
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <span className="font-medium">
                    ${(Number(item.product?.price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotals */}
            <div className="flex flex-col gap-4 border-b border-black/30 pb-4 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
            </div>
            <div className="flex justify-between text-[16px] mb-8 font-semibold">
              <span>Total:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    id="bank" 
                    value="bank"
                    checked={formData.paymentMethod === "bank"}
                    onChange={handleInputChange}
                    className="w-6 h-6 accent-black" 
                  />
                  <label htmlFor="bank" className="text-[16px]">Bank (Simulated)</label>
                </div>
                <div className="flex gap-2">
                   <Image src="/images/bkash.png" alt="bkash" width={42} height={28} />
                   <Image src="/images/visa.png" alt="visa" width={42} height={28} />
                   <Image src="/images/mastercard.png" alt="master" width={42} height={28} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  id="cod" 
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleInputChange}
                  className="w-6 h-6 accent-black" 
                />
                <label htmlFor="cod" className="text-[16px]">Cash on delivery</label>
              </div>
            </div>

            {/* Coupon and Submit */}
            <div className="flex gap-4 mb-8">
              <input 
                type="text" 
                name="couponCode"
                value={formData.couponCode}
                onChange={handleInputChange}
                placeholder="Coupon Code" 
                className="border border-black rounded-[4px] px-6 py-4 flex-grow outline-none" 
              />
              <button 
                type="button"
                className="bg-[#DB4444] text-white px-8 py-4 rounded-[4px] font-medium"
                disabled
              >
                Apply
              </button>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="bg-[#DB4444] text-white px-12 py-4 rounded-[4px] font-medium w-full md:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed transition-all hover:bg-[#E07575]"
            >
              {submitting ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}