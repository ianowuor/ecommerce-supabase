import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { record, type } = await req.json()
  
  // Requirement: Demonstrate usage of Edge Functions & external API logic
  if (type === 'INSERT') {
    const shopifyResponse = await fetch(`https://${Deno.env.get('SHOPIFY_STORE_URL')}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': Deno.env.get('SHOPIFY_ACCESS_TOKEN')!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `mutation { productCreate(input: {title: "${record.name}"}) { product { id } } }`
      })
    })
    // Add logic to update Supabase record with the new Shopify ID here
  }

  return new Response(JSON.stringify({ done: true }), { headers: { "Content-Type": "application/json" } })
})