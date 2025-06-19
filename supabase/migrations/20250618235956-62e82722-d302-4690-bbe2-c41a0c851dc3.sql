
-- First create the admin_audit_log table that's referenced in the security fixes
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create the missing is_admin_user function that matches what the code expects
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = COALESCE($1, auth.uid())
  );
$$;

-- Now create the corrected RLS policies
-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Create policies using the is_admin_user function
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.is_admin_user());

CREATE POLICY "Admins can view all admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (public.is_admin_user());

-- Create RLS policies for admin_audit_log
CREATE POLICY "Admins can view audit logs" 
  ON public.admin_audit_log 
  FOR SELECT 
  USING (public.is_admin_user());

CREATE POLICY "System can insert audit logs" 
  ON public.admin_audit_log 
  FOR INSERT 
  WITH CHECK (true);

-- Create a secure admin bootstrap function
CREATE OR REPLACE FUNCTION public.bootstrap_admin(target_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(input_text TEXT, max_length INTEGER DEFAULT 255)
RETURNS TEXT
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
  
  -- Check length
  IF length(input_text) > max_length THEN
    RAISE EXCEPTION 'Input too long: maximum % characters allowed', max_length;
  END IF;
  
  -- Basic XSS prevention - remove common dangerous patterns
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
  input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
  input_text := regexp_replace(input_text, 'vbscript:', '', 'gi');
  input_text := regexp_replace(input_text, 'onload=', '', 'gi');
  input_text := regexp_replace(input_text, 'onerror=', '', 'gi');
  
  RETURN input_text;
END;
$$;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type TEXT,
  target_user UUID DEFAULT NULL,
  action_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$$;
