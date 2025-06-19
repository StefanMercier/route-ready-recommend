
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const endpoint = url.searchParams.get('endpoint')
    const params = url.searchParams.get('params')
    
    // Get the Google Maps API key from Supabase secrets
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construct the Google Maps API URL
    let googleMapsUrl = `https://maps.googleapis.com/maps/api/${endpoint}?key=${googleMapsApiKey}`
    
    if (params) {
      googleMapsUrl += `&${params}`
    }

    console.log('Making request to Google Maps API:', endpoint)
    
    // Make the request to Google Maps API
    const response = await fetch(googleMapsUrl)
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Google Maps API error:', data)
      return new Response(
        JSON.stringify({ error: 'Google Maps API request failed', details: data }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in Google Maps proxy:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
