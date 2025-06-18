
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function validateSessionId(sessionId: string): boolean {
  // Stripe session IDs start with 'cs_' and are typically 67-69 characters long
  return /^cs_[a-zA-Z0-9_]{60,70}$/.test(sessionId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { session_id } = body;
    
    if (!session_id || typeof session_id !== 'string') {
      throw new Error("Session ID is required and must be a string");
    }

    // Validate session ID format
    if (!validateSessionId(session_id)) {
      throw new Error("Invalid session ID format");
    }

    // Validate Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      throw new Error("Invalid Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session with timeout
    console.log(`Verifying payment session: ${session_id}`);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      throw new Error("Session not found");
    }

    // Validate session metadata
    if (!session.metadata?.user_id || !session.metadata?.user_email) {
      throw new Error("Invalid session metadata");
    }

    if (session.payment_status === "paid") {
      // Use service role to update user payment status
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const userId = session.metadata.user_id;
      const userEmail = session.metadata.user_email;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("Invalid user ID format");
      }

      // Update payment status
      const { error: updateError } = await supabaseService
        .from("profiles")
        .update({ has_paid: true })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating payment status:", updateError);
        throw new Error("Failed to update payment status");
      }

      // Log the successful payment
      console.log(`Payment verified and updated for user ${userId} (${userEmail})`);

      // Optional: Log admin action for audit trail
      try {
        await supabaseService.rpc('log_admin_action', {
          action_type: 'payment_verified',
          target_user: userId,
          action_details: {
            session_id: session_id,
            amount: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_email
          }
        });
      } catch (logError) {
        console.warn("Failed to log admin action:", logError);
        // Don't fail the payment verification for logging issues
      }
    }

    return new Response(JSON.stringify({ 
      payment_status: session.payment_status,
      customer_email: session.customer_email 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    
    // Don't expose internal error details
    const publicError = error.message.includes("Invalid") || 
                       error.message.includes("required") ||
                       error.message.includes("not found")
                       ? error.message 
                       : "Payment verification failed";

    return new Response(JSON.stringify({ error: publicError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
