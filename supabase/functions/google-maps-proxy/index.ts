
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DirectionsRequest {
  origin: string
  destination: string
  travelMode?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the request body
    const { origin, destination, travelMode = 'DRIVING' }: DirectionsRequest = await req.json()

    // Input validation and sanitization
    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Sanitize inputs
    const sanitizeInput = (input: string): string => {
      return input
        .trim()
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .substring(0, 100)
    }

    const sanitizedOrigin = sanitizeInput(origin)
    const sanitizedDestination = sanitizeInput(destination)

    // Get Google Maps API key from secrets
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not configured')
      return new Response(
        JSON.stringify({ error: 'Google Maps API not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format locations for better geocoding
    const formatLocation = (location: string): string => {
      // Add "USA" to ZIP codes to improve geocoding
      if (/^\d{5}(-\d{4})?$/.test(location.trim())) {
        return `${location.trim()}, USA`
      }
      // Add "Canada" to Canadian postal codes
      if (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(location.trim())) {
        return `${location.trim()}, Canada`
      }
      return location.trim()
    }

    const formattedOrigin = formatLocation(sanitizedOrigin)
    const formattedDestination = formatLocation(sanitizedDestination)

    // Call Google Maps Directions API
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${encodeURIComponent(formattedOrigin)}&` +
      `destination=${encodeURIComponent(formattedDestination)}&` +
      `mode=${travelMode.toLowerCase()}&` +
      `key=${googleMapsApiKey}`

    console.log('Calling Google Maps API for:', formattedOrigin, 'to', formattedDestination)

    const response = await fetch(directionsUrl)
    const data = await response.json()

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const leg = route.legs[0]
      
      const result = {
        distance: {
          value: leg.distance?.value || 0,
          text: leg.distance?.text || '0 miles'
        },
        duration: {
          value: leg.duration?.value || 0,
          text: leg.duration?.text || '0 mins'
        },
        distanceInMiles: leg.distance ? leg.distance.value * 0.000621371 : 0,
        durationInHours: leg.duration ? leg.duration.value / 3600 : 0,
        status: 'OK'
      }

      console.log('Successful route calculation:', result)

      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('Google Maps API error:', data.status, data.error_message)
      
      let errorMessage = 'Failed to calculate route'
      if (data.status === 'ZERO_RESULTS') {
        errorMessage = 'No route found between these locations'
      } else if (data.status === 'NOT_FOUND') {
        errorMessage = 'Could not find one or both locations'
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        errorMessage = 'API quota exceeded'
      } else if (data.status === 'REQUEST_DENIED') {
        errorMessage = 'API request denied'
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: data.status,
          details: data.error_message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error in google-maps-proxy function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
