"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Eye, X } from "lucide-react";
import Breadcrumb from "@/components/common/Breadcrumbs";
import { getOrders, cancelOrder, type OrderSummary } from "@/lib/api";
// import { getAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      // FIX: Use Supabase session check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login"); // Redirect instead of just setting an error
        return;
      }

      try {
        const ordersData = await getOrders();
        setOrders(ordersData);
      } catch (err) {
        console.error("Orders load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await cancelOrder(orderId);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: "cancelled" }
            : order
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
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
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 xl:px-0 mb-[140px]">
      <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "Orders", href: "/account/orders" }]} />

      <h1 className="text-[36px] font-medium leading-[48px] tracking-[4%] mb-[48px]">Your Orders</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
          <Link 
            href="/shop" 
            className="bg-[#DB4444] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#E07575] transition-colors inline-block"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-lg font-semibold">
                    Total: ${Number(order.total_amount).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link 
                    href={`/order-details/${order.id}`}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                  
                  {order.status === "processing" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
