import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    const orderId = record.id

    // 1. Get Order and Items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, order_items(quantity, price, products(name))')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Order not found')

    // 2. Fetch Email directly from Supabase Auth via Admin API
    // This bypasses the need for a public email column
    const { data: { user }, error: authError } = await supabaseClient.auth.admin.getUserById(order.user_id)
    
    if (authError || !user?.email) {
      throw new Error(`Auth lookup failed: ${authError?.message ?? 'No email found'}`)
    }

    const userEmail = user.email
    console.log(`Sending confirmation to: ${userEmail}`)

    // 3. Build Items List (same as Wasilisha style but for multiple items)
    const itemsHtml = order.order_items.map((item: any) => 
      `<li>${item.products?.name} (x${item.quantity}) - $${item.price}</li>`
    ).join('')

    // 4. Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'E-commerce Store <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Order Confirmed! #${order.id.slice(0,8)}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Order Confirmation</h2>
            <p>Thank you for your order! We've received your payment of <strong>$${order.total_amount}</strong>.</p>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 10px;">
              <p><strong>Items:</strong></p>
              <ul>${itemsHtml}</ul>
            </div>
            <p>Shipping to: ${order.shipping_address}</p>
          </div>
        `,
      }),
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})