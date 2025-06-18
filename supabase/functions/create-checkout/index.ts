
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    if (token.length < 20) { // Basic token length validation
      throw new Error("Invalid token format");
    }

    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    // Validate and sanitize email
    if (!validateEmail(user.email)) {
      throw new Error("Invalid email format");
    }

    const sanitizedEmail = sanitizeInput(user.email);

    // Validate Stripe key exists
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      throw new Error("Invalid Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists with rate limiting for Stripe API calls
    const customers = await stripe.customers.list({ 
      email: sanitizedEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Validate origin for redirect URLs
    const origin = req.headers.get("origin");
    if (!origin || (!origin.includes("lovableproject.com") && !origin.includes("localhost"))) {
      throw new Error("Invalid origin");
    }

    // Create checkout session with enhanced security
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : sanitizedEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Route Ready Premium Access",
              description: "Unlock full access to Route Ready travel planning features"
            },
            unit_amount: 4999, // $49.99
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planner`,
      metadata: {
        user_id: user.id,
        user_email: sanitizedEmail,
        timestamp: new Date().toISOString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes expiry
    });

    console.log(`Payment session created for user ${user.id}: ${session.id}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    
    // Don't expose internal error details
    const publicError = error.message.includes("Rate limit") || 
                       error.message.includes("Invalid") || 
                       error.message.includes("not authenticated")
                       ? error.message 
                       : "Payment initialization failed";

    return new Response(JSON.stringify({ error: publicError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.includes("Rate limit") ? 429 : 500,
    });
  }
});
