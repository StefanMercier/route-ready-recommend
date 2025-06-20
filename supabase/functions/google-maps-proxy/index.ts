
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "X-Rate-Limit-Remaining": "100",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (clientIP: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(clientIP);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return false;
  }
  
  if (limit.count >= 30) { // 30 requests per minute
    return true;
  }
  
  limit.count++;
  return false;
};

const validateInput = (input: string, maxLength: number = 100): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  
  const trimmed = input.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Input too long: maximum ${maxLength} characters`);
  }
  
  // Remove potentially dangerous characters
  const sanitized = trimmed.replace(/[<>\"'&]/g, '');
  
  if (sanitized !== trimmed) {
    throw new Error('Input contains invalid characters');
  }
  
  return sanitized;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const url = new URL(req.url);
    const service = validateInput(url.searchParams.get("service") || "");
    
    if (!service) {
      return new Response(
        JSON.stringify({ error: "Service parameter required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate allowed services
    const allowedServices = ["directions", "geocoding", "places"];
    if (!allowedServices.includes(service)) {
      return new Response(
        JSON.stringify({ error: "Service not allowed" }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      console.error("Google Maps API key not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Build Google Maps API URL with validation
    const googleUrl = new URL(`https://maps.googleapis.com/maps/api/${service}/json`);
    
    // Copy and validate query parameters
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "service") {
        try {
          const validatedValue = validateInput(value, 200);
          googleUrl.searchParams.set(key, validatedValue);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Invalid parameter format" }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      }
    }
    
    googleUrl.searchParams.set("key", apiKey);

    const response = await fetch(googleUrl.toString(), {
      method: req.method,
      headers: {
        "User-Agent": "TripStrs-Proxy/1.0"
      }
    });

    if (!response.ok) {
      console.error(`Google Maps API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: "External service error" }), 
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300" // 5 minutes cache
      }
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
