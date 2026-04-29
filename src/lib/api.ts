import { supabase } from "@/lib/supabase";

/** * TYPES 
 * Updated IDs from 'number' to 'string' to support Supabase UUIDs
 */
export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
};

export type Product = {
  id: string; 
  name: string;
  description?: string;
  price: number; // Supabase numeric maps to JS number
  image_url?: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
};

export type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    image_url?: string;
  };
};

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  created_at: string;
  order_items?: OrderItem[]; // Add this line
};

export type OrderSummary = Pick<Order, 'id' | 'total_amount' | 'status' | 'created_at'>;

export type OrderCreate = {
  shipping_address: string;
  total_amount: number; // Calculated on frontend or via RPC
};

/**
 * AUTH FUNCTIONS
 */
export async function register(payload: RegisterPayload): Promise<void> {
  // 1. Sign up user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (authError) throw authError;

  // 2. Insert into your custom public.users table
  if (authData.user) {
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      full_name: payload.full_name,
      phone: payload.phone,
      address: payload.address,
    });
    if (profileError) throw profileError;
  }
}

export async function login(payload: LoginPayload): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });
  if (error) throw error;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * PRODUCT FUNCTIONS
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Product[];
}

/**
 * CART FUNCTIONS
 */
export async function getCartItems() {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      user_id,
      quantity,
      product_id,
      product:products!inner (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown) as CartItem[];
}

export async function addToCart(productId: string, quantity: number = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  // This mirrors your FastAPI logic: If exists, increment; else, insert.
  // We use .upsert() with 'onConflict' to match your uq_cart_user_product constraint.
  
  // First, let's get the existing quantity if it exists
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  const newQuantity = (existingItem?.quantity || 0) + quantity;

  const { data, error } = await supabase
    .from('cart_items')
    .upsert({ 
      user_id: user.id, 
      product_id: productId, 
      quantity: newQuantity 
    }, { onConflict: 'user_id,product_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * ORDER FUNCTIONS
 */
// export async function createOrder(orderData: { 
//   shipping_address: string; 
//   total_amount: number;
//   payment_method: string; 
// }): Promise<Order> {
//   const { data, error } = await supabase.rpc('place_order', {
//     // These keys must match the parameter names in your SQL function exactly
//     p_shipping_address: orderData.shipping_address,
//     p_total_amount: orderData.total_amount,
//     p_payment_method: orderData.payment_method
//   });

//   if (error) {
//     console.error("Supabase RPC Error:", error);
//     throw new Error(error.message || "Failed to place order");
//   }

//   // Ensure data exists before trying to fetch the order
//   if (!data || !data.id) {
//     throw new Error("Order creation failed: No ID returned");
//   }

//   return await getOrder(data.id);
// }
export async function createOrder(orderData: { 
  shipping_address: string; 
  total_amount: number;
  payment_method: string; 
}): Promise<Order> {
  const { data, error } = await supabase.rpc('place_order', {
    p_shipping_address: orderData.shipping_address,
    p_total_amount: orderData.total_amount,
    p_payment_method: orderData.payment_method
  });

  if (error) {
    console.error("Supabase RPC Error:", error);
    throw new Error(error.message || "Failed to place order");
  }

  // data here is the return value of your SQL function 'place_order'
  // Since your SQL function returns 'public.orders', 'data' IS the order!
  return data as Order; 
}

export async function getOrders(): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, total_amount, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as OrderSummary[];
}

export async function getOrder(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        product:products (
          name,
          image_url
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) throw error;
  
  // Using 'as unknown as Order' handles the nested array-to-object mapping issues
  return (data as unknown) as Order;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (error) throw error;
}