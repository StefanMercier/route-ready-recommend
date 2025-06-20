
-- Add usage tracking to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;

-- Add usage limit constant (5 free uses)
COMMENT ON COLUMN public.profiles.usage_count IS 'Number of route calculations used by the user';
