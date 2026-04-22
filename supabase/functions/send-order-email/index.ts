// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define the shape of the incoming webhook payload from Supabase
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    shipping_address: string;
  };
  schema: string;
}

serve(async (req) => {
  try {
    // 1. Parse the request body sent by the Postgres Trigger
    const payload: WebhookPayload = await req.json();
    const { record, type } = payload;

    console.log(`Function triggered for ${type} on table ${payload.table}`);

    // 2. Logic: Only send email on NEW orders
    if (type === 'INSERT') {
      const orderId = record.id;
      const total = record.total_amount;

      console.log(`Processing Order #${orderId} for $${total}...`);

      // 3. Email Sending Logic
      // In a real app, you'd use: fetch('https://api.resend.com/emails', { ... })
      // For your demonstration, we simulate the 'Queue' processing:
      const emailStatus = await simulateEmailSend(record);

      return new Response(
        JSON.stringify({ 
          message: "Email queued and processed successfully", 
          order_id: orderId,
          status: emailStatus 
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ message: "Ignored non-insert event" }), { status: 200 });

  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { "Content-Type": "application/json" }, 
      status: 400 
    });
  }
})

// Mock function to demonstrate asynchronous processing
async function simulateEmailSend(order: any) {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const logMsg = `[EMAIL SENT] To User: ${order.user_id} | Subject: Order Confirmation #${order.id} | Total: $${order.total_amount}`;
  console.log(logMsg);
  
  return "Sent";
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-order-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
