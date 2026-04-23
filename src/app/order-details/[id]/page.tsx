"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Truck, CreditCard, ArrowLeft } from "lucide-react";
import Breadcrumb from "@/components/common/Breadcrumbs";
import { getOrder, cancelOrder, type Order } from "@/lib/api";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        // REMOVE parseInt() - UUIDs are strings
        const orderData = await getOrder(orderId); 
        setOrder(orderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      setCancelling(true);
      await cancelOrder(orderId);
      // Update the order status
      if (order) {
        setOrder({ ...order, status: "cancelled" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 xl:px-0 mb-[140px]">
      <Breadcrumb 
        items={[
          { label: "Account", href: "/account" }, 
          { label: "Orders", href: "/account/orders" }, 
          { label: `Order #${order.id}`, href: `/order-details/${order.id}` }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/account/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-[36px] font-medium leading-[48px] tracking-[4%]">
            Order #{order.id}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {order.status === "processing" && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.product?.name || "Product"}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${Number(order.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Information</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Address
            </h2>
            <p className="text-gray-700">{order.shipping_address}</p>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h2>
            <p className="text-gray-700 capitalize">
              {order.payment_method?.replace('_', ' ') ?? "Not specified"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link 
          href="/shop" 
          className="bg-[#DB4444] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#E07575] transition-colors text-center"
        >
          Continue Shopping
        </Link>
        <Link 
          href="/account/orders" 
          className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );
}
