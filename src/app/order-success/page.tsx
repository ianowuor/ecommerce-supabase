"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Package, Truck, CreditCard } from "lucide-react";
import { getOrder, type Order } from "@/lib/api";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) {
      router.push("/shop");
      return;
    }

    const loadOrder = async () => {
      try {
        // FIX: Remove parseInt because orderId is a UUID string
        const orderData = await getOrder(orderId); 
        setOrder(orderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="max-w-[1170px] mx-auto px-4 xl:px-0 py-20">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-[1170px] mx-auto px-4 xl:px-0 py-20">
        <div className="text-center text-red-600 mb-4">{error || "Order not found"}</div>
        <div className="text-center">
          <Link href="/account/orders" className="text-blue-600 hover:underline">
            View Your Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 xl:px-0 py-20">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. Your order #{order.id} has been successfully placed.
        </p>

        {/* Order Details Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-lg">${Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
  <span className="text-gray-600">Payment Method:</span>
  <span className="capitalize">
    {/* FIX: Add optional chaining and fallback */}
    {order.payment_method?.replace('_', ' ') ?? "Not specified"}
  </span>
</div>
          </div>

          {/* Shipping Address */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Shipping Address</h3>
            <p className="text-gray-600">{order.shipping_address}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          
          <div className="space-y-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.product?.name || "Product"}</h4>
                    <p className="text-sm text-gray-600">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
                <span className="font-medium">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            What's Next?
          </h2>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium">Order Processing</h4>
                <p className="text-sm">We're preparing your order for shipment.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium">Shipping</h4>
                <p className="text-sm">Your order will be shipped within 1-2 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium">Delivery</h4>
                <p className="text-sm">Estimated delivery: 3-5 business days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/shop" 
            className="bg-[#DB4444] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#E07575] transition-colors"
          >
            Continue Shopping
          </Link>
          <Link 
            href="/account/orders" 
            className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
}
