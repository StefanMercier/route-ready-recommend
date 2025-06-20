
-- Remove the conflicting RLS policy that uses the deprecated is_admin function
DROP POLICY IF EXISTS "Admins can update payment status" ON public.profiles;

-- Remove the deprecated is_admin function to prevent confusion
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Add proper input length validation to the validate_and_sanitize_input function
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(input_text text, max_length integer DEFAULT 255)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return null for null input
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace
  input_text := trim(input_text);
  
  -- Check length with proper validation
  IF length(input_text) > max_length THEN
    RAISE EXCEPTION 'Input too long: maximum % characters allowed, got % characters', max_length, length(input_text);
  END IF;
  
  -- Enhanced XSS prevention - remove common dangerous patterns
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
  input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
  input_text := regexp_replace(input_text, 'vbscript:', '', 'gi');
  input_text := regexp_replace(input_text, 'data:', '', 'gi');
  input_text := regexp_replace(input_text, 'onload=', '', 'gi');
  input_text := regexp_replace(input_text, 'onerror=', '', 'gi');
  input_text := regexp_replace(input_text, 'onclick=', '', 'gi');
  input_text := regexp_replace(input_text, 'onmouseover=', '', 'gi');
  
  -- Remove null bytes and control characters
  input_text := regexp_replace(input_text, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  
  RETURN input_text;
END;
$$;

-- Create a more secure admin audit logging function with better validation
CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, target_user uuid DEFAULT NULL::uuid, action_details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate that the current user is an admin
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate and sanitize action_type
  IF action_type IS NULL OR trim(action_type) = '' THEN
    RAISE EXCEPTION 'Action type cannot be empty';
  END IF;
  
  action_type := public.validate_and_sanitize_input(action_type, 100);
  
  -- Insert the audit log entry
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$$;
