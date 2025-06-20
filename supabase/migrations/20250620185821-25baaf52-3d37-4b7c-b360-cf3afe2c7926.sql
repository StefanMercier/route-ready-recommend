
-- Fix all function search_path security vulnerabilities by setting secure search paths
-- This prevents SQL injection attacks through search_path manipulation

CREATE OR REPLACE FUNCTION public.owns_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(auth.uid() = profile_id, FALSE);
$$;

CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND LENGTH(email_input) <= 254
    AND email_input NOT LIKE '%..%'
    AND email_input NOT LIKE '.%'
    AND email_input NOT LIKE '%.'
    AND email_input NOT LIKE '%@.'
    AND email_input NOT LIKE '.@%';
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = COALESCE($1, auth.uid())
    )), 
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_admin(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only allow if no admins exist yet
  IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    RAISE EXCEPTION 'Admin bootstrap not allowed: Admin users already exist';
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', target_email;
  END IF;
  
  -- Create admin user
  INSERT INTO public.admin_users (user_id, email)
  VALUES (target_user_id, target_email);
  
  -- Log the bootstrap action
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (target_user_id, 'admin_bootstrap', target_user_id, jsonb_build_object('bootstrap_email', target_email));
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(input_text text, max_length integer DEFAULT 255)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, target_user uuid DEFAULT NULL::uuid, action_details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
As $$
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

-- Fix the handle_new_user function as well for consistency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;
