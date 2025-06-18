
-- Add has_paid column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN has_paid BOOLEAN NOT NULL DEFAULT false;

-- Create an admin_users table to track admin privileges
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own admin status
CREATE POLICY "Users can view own admin status" 
  ON public.admin_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for admins to view all admin users
CREATE POLICY "Admins can view all admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for edge functions to insert/update admin users
CREATE POLICY "Service can manage admin users" 
  ON public.admin_users 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = $1
  );
$$;

-- Policy for admins to update any user's payment status
CREATE POLICY "Admins can update payment status" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() = id OR 
    public.is_admin(auth.uid())
  );
