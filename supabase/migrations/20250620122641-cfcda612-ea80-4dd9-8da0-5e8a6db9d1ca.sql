
-- Fix security warnings by ensuring proper RLS policies and constraints

-- 1. Ensure profiles table has proper NOT NULL constraints where needed
ALTER TABLE public.profiles 
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- 2. Add proper indexes for security and performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- 3. Drop any conflicting or redundant RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 4. Create comprehensive and secure RLS policies for profiles
CREATE POLICY "profiles_select_own" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" 
  ON public.profiles 
  FOR DELETE 
  USING (auth.uid() = id);

-- 5. Admin policies for profiles (separate from user policies)
CREATE POLICY "profiles_admin_all" 
  ON public.profiles 
  FOR ALL 
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6. Secure admin_users table policies
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "admin_users_view_own" 
  ON public.admin_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "admin_users_admin_all" 
  ON public.admin_users 
  FOR ALL 
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 7. Secure audit log policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

CREATE POLICY "audit_log_admin_select" 
  ON public.admin_audit_log 
  FOR SELECT 
  USING (public.is_admin_user());

CREATE POLICY "audit_log_insert_authenticated" 
  ON public.admin_audit_log 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Add data validation constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.admin_users 
  ADD CONSTRAINT admin_users_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 9. Ensure proper foreign key constraints
ALTER TABLE public.admin_users 
  DROP CONSTRAINT IF EXISTS admin_users_user_id_fkey,
  ADD CONSTRAINT admin_users_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.admin_audit_log 
  DROP CONSTRAINT IF EXISTS admin_audit_log_admin_user_id_fkey,
  ADD CONSTRAINT admin_audit_log_admin_user_id_fkey 
  FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 10. Update security functions to be more robust
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = COALESCE($1, auth.uid())
    )), 
    FALSE
  );
$$;

-- 11. Add function to check if user owns profile
CREATE OR REPLACE FUNCTION public.owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(auth.uid() = profile_id, FALSE);
$$;

-- 12. Add comprehensive input validation function
CREATE OR REPLACE FUNCTION public.validate_email(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND LENGTH(email_input) <= 254
    AND email_input NOT LIKE '%..%'
    AND email_input NOT LIKE '.%'
    AND email_input NOT LIKE '%.'
    AND email_input NOT LIKE '%@.'
    AND email_input NOT LIKE '.@%';
$$;
