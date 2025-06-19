
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://gklfrynehiqrwbddvaaa.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { origin, destination, travelMode = 'DRIVING' } = await req.json()
    
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

    // Validate required parameters
    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Input sanitization
    const sanitizedOrigin = origin.toString().substring(0, 100)
    const sanitizedDestination = destination.toString().substring(0, 100)
    const sanitizedTravelMode = ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'].includes(travelMode) 
      ? travelMode : 'DRIVING'

    // Construct the Google Maps API URL for directions
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${encodeURIComponent(sanitizedOrigin)}&` +
      `destination=${encodeURIComponent(sanitizedDestination)}&` +
      `mode=${sanitizedTravelMode.toLowerCase()}&` +
      `key=${googleMapsApiKey}`

    console.log('Making secure request to Google Maps API for directions')
    
    // Make the request to Google Maps API
    const response = await fetch(googleMapsUrl)
    const data = await response.json()
    
    if (!response.ok || data.status !== 'OK') {
      console.error('Google Maps API error:', data)
      return new Response(
        JSON.stringify({ 
          error: 'Unable to calculate route', 
          status: data.status || 'UNKNOWN_ERROR' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract route information securely
    const route = data.routes?.[0]
    if (!route) {
      return new Response(
        JSON.stringify({ error: 'No route found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const leg = route.legs?.[0]
    if (!leg) {
      return new Response(
        JSON.stringify({ error: 'Invalid route data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Convert to miles and hours for consistency
    const distanceInMiles = Math.round((leg.distance?.value || 0) * 0.000621371 * 100) / 100
    const durationInHours = Math.round((leg.duration?.value || 0) / 3600 * 100) / 100

    const secureResponse = {
      status: 'OK',
      distanceInMiles,
      durationInHours,
      distanceText: leg.distance?.text || 'Unknown',
      durationText: leg.duration?.text || 'Unknown'
    }

    return new Response(JSON.stringify(secureResponse), {
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
